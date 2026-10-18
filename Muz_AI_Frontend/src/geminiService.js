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

/**
 * OPTION B: If your Supabase table (`notes`) stores each note as an individual row
 */
export async function syncNotesTableRows(songId, updatedNotes) {
  // 1. Clear removed notes for this song
  await supabase.from('notes').delete().eq('song_id', songId);

  // 2. Upsert the modified note set
  const rowsToInsert = updatedNotes.map((n) => ({
    id: n.id,
    song_id: songId,
    pitch: n.pitch,
    note: n.note,
    start: n.start,
    duration: n.duration,
    velocity: n.velocity,
  }));

  const { data, error } = await supabase.from('notes').insert(rowsToInsert);
  if (error) throw error;
  return data;
}