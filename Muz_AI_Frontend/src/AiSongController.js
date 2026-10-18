// src/useAiSongController.js
import { useState, useEffect } from 'react';
import { modifySongWithGemini } from './geminiService';
import { supabase, syncSongNotesJSONB } from './supabaseClient';

export function useAiSongController(initialNotes, songId = 'default-song-1') {
  const [notes, setNotes] = useState(initialNotes);
  const [messages, setMessages] = useState([
    { id: 'welcome', sender: 'ai', text: 'Hi! how can I help?' }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  // 1. Load initial notes from Supabase on mount
  useEffect(() => {
    async function loadSong() {
      const { data, error } = await supabase
        .from('songs')
        .select('notes')
        .eq('id', songId)
        .single();

      if (data?.notes && !error) {
        setNotes(data.notes);
      }
    }
    loadSong();
  }, [songId]);

  // 2. Call this on mouseup (drag end) to save manual edits to Supabase
  const saveNotesToSupabase = async (notesToSave = notes) => {
    try {
      await syncSongNotesJSONB(songId, notesToSave);
    } catch (err) {
      console.error('Failed to sync manual edit to Supabase:', err);
    }
  };

  // 3. Handle AI Assistant Chat Prompt -> Gemini -> State -> Supabase
  const handleSendPrompt = async (userText) => {
    if (!userText.trim() || isGenerating) return;

    const userMsg = { id: `u-${Date.now()}`, sender: 'user', text: userText };
    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);

    try {
      const result = await modifySongWithGemini(userText, notes);

      if (Array.isArray(result.notes)) {
        setNotes(result.notes);
        await syncSongNotesJSONB(songId, result.notes);
      }

      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, sender: 'ai', text: result.reply }
      ]);
    } catch (error) {
      console.error('Error modifying song with Gemini:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: 'Sorry, I ran into an issue updating the notes. Check your API key or console.'
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    notes,
    setNotes, // Keeps fast 60fps local dragging working
    saveNotesToSupabase, // Call when dragging finishes
    messages,
    isGenerating,
    handleSendPrompt,
  };
}