import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3@3.400.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  getCorsHeaders,
  handleCorsPrelight,
  checkRateLimit,
  getRateLimitIdentifier,
  rateLimitedResponse,
  RATE_LIMITS,
  errorResponse,
} from '../_shared/security.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(req);
  }

  // Only allow POST method for uploads
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, corsHeaders);
  }

  try {
    const ADMIN_MAX_FILE_SIZE = 50 * 1024 * 1024;
    const CHECKER_MAX_FILE_SIZE = 8 * 1024 * 1024;
    const MAX_MULTIPART_OVERHEAD = 1024 * 1024;
    const uploadPurpose = req.headers.get('x-upload-purpose') || 'admin-content';
    const isWritingCheckerUpload = uploadPurpose === 'writing-checker';
    const maxFileSize = isWritingCheckerUpload ? CHECKER_MAX_FILE_SIZE : ADMIN_MAX_FILE_SIZE;
    const contentLengthHeader = req.headers.get('content-length');
    const contentLength = Number(contentLengthHeader);
    if (!contentLengthHeader || !Number.isSafeInteger(contentLength) || contentLength <= 0) {
      return errorResponse('A valid Content-Length header is required.', 411, corsHeaders);
    }
    if (contentLength > maxFileSize + MAX_MULTIPART_OVERHEAD) {
      return errorResponse(
        `File too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB.`,
        413,
        corsHeaders
      );
    }

    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader ?? '' } } }
    );

    // Identity check: derive user from JWT
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader?.split(' ')[1]);

    if (authError || !user) {
      return errorResponse('Unauthorized', 401, corsHeaders);
    }

    // This upload surface is used only by authenticated content-management tools.
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
    if (adminError) {
      return errorResponse('Could not verify upload permissions', 503, corsHeaders);
    }
    if (!isAdmin && !isWritingCheckerUpload) {
      return errorResponse('Administrator access required', 403, corsHeaders);
    }

    const rateLimit = checkRateLimit(getRateLimitIdentifier(req, user.id), RATE_LIMITS.EXPENSIVE);
    if (!rateLimit.allowed) return rateLimitedResponse(rateLimit.resetIn, corsHeaders);

    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return errorResponse('No file uploaded', 400, corsHeaders);
    }

    if (file.size > maxFileSize) {
      return errorResponse(
        `File too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB.`,
        413,
        corsHeaders
      );
    }

    const fileType = file.type || '';
    const checkerMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
    const adminMimePrefixes = ['audio/', 'image/', 'video/', 'application/pdf'];
    const hasAllowedType = isWritingCheckerUpload
      ? checkerMimeTypes.has(fileType)
      : adminMimePrefixes.some((prefix) => fileType.startsWith(prefix));
    if (!hasAllowedType) {
      return errorResponse(
        isWritingCheckerUpload
          ? 'File type not allowed. Use PNG, JPG, or WebP for a Writing Task 1 visual.'
          : 'File type not allowed. Only audio, image, video, and PDF files are accepted.',
        415,
        corsHeaders
      );
    }

    const R2_ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID');
    const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME') || 'ielts-ai-media';
    const R2_PUBLIC_URL = Deno.env.get('R2_PUBLIC_URL') || `https://${R2_BUCKET_NAME}.r2.dev`;

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      console.error('Missing R2 Configuration');
      throw new Error('Server configuration error');
    }

    const S3 = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });

    // Sanitize filename
    const originalName = file.name?.trim() || 'upload.bin';
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const keyPrefix = isWritingCheckerUpload ? `writing-checker/${user.id}` : 'uploads';
    const key = `${keyPrefix}/${Date.now()}_${sanitizedName}`;

    // Inspect only the header bytes. Passing the File/Blob directly lets the
    // S3 fetch handler stream it instead of allocating a second full-size copy.
    const signatureBytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (!hasExpectedFileSignature(fileType, signatureBytes)) {
      return errorResponse('File content does not match its declared type.', 415, corsHeaders);
    }

    // Upload to R2
    await S3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: file,
        ContentLength: file.size,
        ContentType: file.type,
      })
    );

    const fileUrl = `${R2_PUBLIC_URL}/${key}`;

    return new Response(
      JSON.stringify({
        file_url: fileUrl,
        key: key,
        message: 'File uploaded successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Upload Error:', error);
    return errorResponse('Upload failed. Please try again.', 500, corsHeaders);
  }
});

function hasExpectedFileSignature(mime: string, bytes: Uint8Array): boolean {
  const ascii = (start: number, length: number) =>
    String.fromCharCode(...bytes.slice(start, start + length));

  if (mime === 'application/pdf') return ascii(0, 4) === '%PDF';
  if (mime === 'image/png') return ascii(1, 3) === 'PNG';
  if (mime === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8;
  if (mime === 'image/gif') return ascii(0, 3) === 'GIF';
  if (mime === 'image/webp') return ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP';
  if (mime === 'audio/wav' || mime === 'audio/x-wav') {
    return ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WAVE';
  }
  if (mime === 'audio/mpeg') {
    return ascii(0, 3) === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  }
  if (mime === 'audio/ogg' || mime === 'video/ogg') return ascii(0, 4) === 'OggS';
  if (mime === 'video/webm' || mime === 'audio/webm') {
    return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  }
  if (mime === 'video/mp4' || mime === 'audio/mp4' || mime === 'audio/x-m4a') {
    return ascii(4, 4) === 'ftyp';
  }
  return false;
}
