import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize Supabase client with Service Role Key to bypass RLS for server-side generation
// If SERVICE_ROLE_KEY is missing, it falls back to ANON_KEY (which might fail RLS).
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

/**
 * Generate a presigned URL for uploading a file to a Supabase Storage bucket.
 * 
 * @param bucketName The name of the storage bucket (e.g. 'evidence')
 * @param path The path where the file will be stored (e.g. 'incidents/INC-123/photo.jpg')
 * @param expiresIn Time in seconds until the URL expires (default 60s)
 * @returns An object containing the presigned URL
 */
export async function generateUploadUrl(bucketName: string, path: string, expiresIn = 60) {
  const { data, error } = await supabaseAdmin
    .storage
    .from(bucketName)
    .createSignedUploadUrl(path, {
      expiresIn
    });

  if (error) {
    throw new Error(`Supabase storage error: ${error.message}`);
  }

  // The generated URL is relative to the bucket endpoint, we need to construct the full URL
  const signedUrl = data.signedUrl;
  return {
    signedUrl,
    path: data.path
  };
}
