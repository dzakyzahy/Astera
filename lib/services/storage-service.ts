import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export class StorageService {
  private bucketName = 'evidence';

  async uploadFile(file: File, path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload to Supabase Storage: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }
}
