import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3@3.400.0"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPrelight, errorResponse } from '../_shared/security.ts'

serve(async (req) => {
    const corsHeaders = getCorsHeaders(req)

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return handleCorsPrelight(req)
    }

    // Only allow POST method for uploads
    if (req.method !== 'POST') {
        return errorResponse('Method not allowed', 405, corsHeaders)
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Identity check: derive user from JWT
        const authHeader = req.headers.get('Authorization')
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader?.split(' ')[1])

        if (authError || !user) {
            return errorResponse('Unauthorized', 401, corsHeaders)
        }
        const formData = await req.formData()
        const file = formData.get('file')

        if (!file) {
            return errorResponse('No file uploaded', 400, corsHeaders)
        }

        // File size limit: 50MB
        const MAX_FILE_SIZE = 50 * 1024 * 1024
        if (file.size > MAX_FILE_SIZE) {
            return errorResponse('File too large. Maximum size is 50MB.', 413, corsHeaders)
        }

        // MIME type whitelist: only allow audio, image, and video
        const ALLOWED_MIME_PREFIXES = ['audio/', 'image/', 'video/', 'application/pdf']
        const fileType = file.type || ''
        if (!ALLOWED_MIME_PREFIXES.some(prefix => fileType.startsWith(prefix))) {
            return errorResponse('File type not allowed. Only audio, image, and video files are accepted.', 415, corsHeaders)
        }

        const R2_ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')
        const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID')
        const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY')
        const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME') || 'ielts-ai-media'
        const R2_PUBLIC_URL = Deno.env.get('R2_PUBLIC_URL') || `https://${R2_BUCKET_NAME}.r2.dev`

        if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
            console.error("Missing R2 Configuration")
            throw new Error("Server configuration error")
        }

        const S3 = new S3Client({
            region: 'auto',
            endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: R2_ACCESS_KEY_ID,
                secretAccessKey: R2_SECRET_ACCESS_KEY,
            },
        })

        // Sanitize filename
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const key = `uploads/${Date.now()}_${sanitizedName}`

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const body = new Uint8Array(arrayBuffer)

        // Upload to R2
        await S3.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: body,
            ContentType: file.type,
        }))

        const fileUrl = `${R2_PUBLIC_URL}/${key}`

        return new Response(
            JSON.stringify({
                file_url: fileUrl,
                key: key,
                message: 'File uploaded successfully'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error) {
        console.error('Upload Error:', error)
        return errorResponse(error.message, 500, corsHeaders)
    }
})
