# Cloudflare R2 Storage Integration Guide

This project uses Cloudflare R2 object storage for serving media assets (audio, images) efficiently and cost-effectively.

## 1. Setup & Configuration

### Environment Variables
For the integration to work, you must configure the following environment variables.

#### Local Development (`.env`)
Ensure your `.env` file includes:

```env
# Supabase - for migration, use PRODUCTION URL
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=ielts-ai-media
R2_PUBLIC_URL=https://media.ieltsai.pro
VITE_R2_PUBLIC_URL=https://media.ieltsai.pro
```

#### Supabase Edge Functions (`supabase/functions/.env`)
The Edge Function used for secure uploads also requires these variables.

```env
CLOUDFLARE_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=ielts-ai-media
R2_PUBLIC_URL=https://media.ieltsai.pro
```

Push these secrets to your production Supabase project:
```bash
supabase secrets set CLOUDFLARE_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET_NAME=ielts-ai-media R2_PUBLIC_URL=https://media.ieltsai.pro
```

### Deploying the Edge Function
Deploy the `r2-upload` function to handle secure uploads from the admin panel:

```bash
supabase functions deploy r2-upload
```

## 2. Vercel Deployment

When deploying the frontend to Vercel, you must add the environment variables in the Vercel Project Settings.

1. Go to your Vercel Project > Settings > Environment Variables.
2. Add the following:
   - `VITE_R2_PUBLIC_URL`: `https://media.ieltsai.pro`
   - `VITE_SUPABASE_URL`: Your production Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your production anon key

Note: The `CLOUDFLARE_*` and `R2_*` keys are **NOT** required for the frontend (Vercel), as uploads are handled via the Supabase Edge Function. Currently, only `VITE_R2_PUBLIC_URL` is needed for the frontend to construct URLs.

## 3. Migration Process

The migration script transfers existing media from third-party URLs to R2 storage.

### Prerequisites

**IMPORTANT**: The migration script uses the Supabase credentials from your `.env`. To migrate production data:

1. **Temporarily set production credentials** in your `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-actual-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
   ```

2. **Get your production service role key** from:
   - Supabase Dashboard > Project Settings > API > Service Role Key

### Running the Migration

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Create the media_assets table** (run this migration if not already done):
   ```bash
   supabase db push
   ```

3. **Run Migration Script**:
   ```bash
   node scripts/migrate-media-to-r2.js
   ```

   The script will show which database it's connecting to and:
   - Migrate audio files from `passages.audio_url`
   - Migrate map images from `questions.map_labeling.image_url`
   - Migrate inline `[image]URL[/image]` tags in passage content
   - Migrate writing test images from `tests.content`
   - Record all mappings in `media_assets` table for rollback capability

### Rollback Strategy

If you need to rollback:
1. The `media_assets` table contains the original URL for each migrated asset
2. You can write a reverse script to restore original URLs from this table

## 4. Custom Domain Setup (Cloudflare)

Your custom domain `media.ieltsai.pro` should already be connected. To verify:

1. Log in to Cloudflare Dashboard > R2.
2. Select your bucket (`ielts-ai-media`).
3. Go to **Settings** > **Public Access** > **Custom Domains**.
4. Confirm `media.ieltsai.pro` is listed and active.

## 5. Admin Panel Usage

After integration, the admin panel will:
- **ListeningTestEditor**: Upload audio files directly to R2
- **MapLabelingBuilder**: Upload map images to R2
- **WritingTestEditor**: Upload reference images to R2
- **ReadingTestEditor**: Upload images via the rich text editor to R2

All uploads go through the Supabase Edge Function (`r2-upload`) for security.

## 6. Fallback Behavior

The `getMediaUrl()` helper in `src/lib/media.ts` provides fallback logic:
- Returns R2 URL if available
- Falls back to original URL if R2 URL is not set
- Handles null/undefined gracefully

## 7. Troubleshooting

### Upload Failures
- Check Supabase Function logs: Dashboard > Edge Functions > r2-upload > Logs
- Verify R2 credentials have `Admin Read & Write` permissions
- Ensure the bucket name is correct

### CORS Issues
For downloading/viewing, ensure your R2 bucket allows your domains:

1. Go to Cloudflare Dashboard > R2 > your bucket > Settings
2. Under CORS, add:
   ```json
   [
     {
       "AllowedOrigins": ["https://ieltsai.pro", "https://your-app.vercel.app", "http://localhost:5173"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedHeaders": ["*"]
     }
   ]
   ```

### Migration Issues
- If migration shows `127.0.0.1`, you're connected to local DB - update `.env`
- Check Supabase project URL in Dashboard > Project Settings
- Ensure service role key has full database access
