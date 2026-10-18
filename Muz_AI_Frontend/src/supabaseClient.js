import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/**
 * OPTION A: If your Supabase table (`songs`) has a `notes` JSONB column
 */
export async function syncSongNotesJSONB(songId, updatedNotes) {
  const { data, error } = await supabase
    .from('songs')
    .update({ notes: updatedNotes, updated_at: new Date().toISOString() })
    .eq('id', songId)
    .select();

  if (error) throw error;
  return data;
}