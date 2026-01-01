import { supabase } from "./supabaseClient";

/**
 * Uploads a base64 image string to Supabase Storage.
 * Assumes a bucket named 'bot-assets' exists and has appropriate RLS policies.
 */
export async function uploadImageToStorage(userId: string, base64Data: string, type: 'portrait' | 'scenario'): Promise<string | null> {
  if (!supabase) {
    console.warn('Supabase client not initialized. Cannot upload to storage.');
    return null;
  }

  try {
    // Remove base64 header if present
    const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    // Organized folder structure: user_id/timestamp-type.png
    const fileName = `${userId}/${Date.now()}-${type}.png`;
    
    const { data, error } = await supabase.storage
      .from('bot-assets')
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) throw error;

    // Retrieve the public URL for the uploaded asset
    const { data: { publicUrl } } = supabase.storage
      .from('bot-assets')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (err) {
    console.error('Storage upload failed:', err);
    return null;
  }
}
