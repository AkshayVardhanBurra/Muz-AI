import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { supabase } from '../lib/supabaseClient';

// ============================================================================
// 1. CONSTANTS & INITIAL DATA
// ============================================================================

const INITIAL_NOTES = [
  { id: "m1", pitch: 62, note: "D4", start: 0.0, duration: 0.35, velocity: 85 },
  { id: "m2", pitch: 62, note: "D4", start: 0.35, duration: 0.35, velocity: 85 },
  { id: "m3", pitch: 74, note: "D5", start: 0.7, duration: 0.6, velocity: 95 },
  { id: "m4", pitch: 69, note: "A4", start: 1.4, duration: 0.5, velocity: 90 },
  { id: "m5", pitch: 68, note: "G#4", start: 2.0, duration: 0.4, velocity: 88 },
  { id: "m6", pitch: 67, note: "G4", start: 2.5, duration: 0.4, velocity: 86 },
  { id: "m7", pitch: 65, note: "F4", start: 3.0, duration: 0.3, velocity: 85 },
  { id: "m8", pitch: 62, note: "D4", start: 3.3, duration: 0.25, velocity: 80 },
  { id: "m9", pitch: 65, note: "F4", start: 3.55, duration: 0.25, velocity: 82 },
  { id: "m10", pitch: 67, note: "G4", start: 3.8, duration: 0.3, velocity: 85 },
  { id: "m11", pitch: 50, note: "D3", start: 0.0, duration: 4.5, velocity: 75 },
  { id: "m12", pitch: 46, note: "Bb2", start: 0.0, duration: 4.5, velocity: 72 }
];

function readNotes(song) {
  if (Array.isArray(song)) return song;
  if (song && Array.isArray(song.notes)) return song.notes;
  return [];
}

// Layout & Grid Constants
const ROW_HEIGHT = 44;         // Height of each key row in pixels
const PIXELS_PER_SECOND = 180; // Horizontal scale: 180px per 1.0 second
const QUARTER_INTERVAL = 0.5;  // Each vertical grid division represents 1/4 bar (0.5s at 120 BPM)
const TOTAL_QUARTERS = 32;     // Total 1/4 subdivisions rendered in timeline
const KEY_COL_WIDTH = 165;     // Width of the left 61-key column

// Generate 61 Standard Keyboard Keys (C2 = MIDI 36 to C7 = MIDI 96)
const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

const generate61Keys = () => {
  const keys = [];
  // Standard 61-key keyboard ranges from C2 (MIDI 36) to C7 (MIDI 96)
  // Ordered highest pitch at the top to lowest pitch at the bottom
  for (let midi = 96; midi >= 36; midi--) {
    const octave = Math.floor(midi / 12) - 1;
    const noteIndex = midi % 12;
    const noteName = `${NOTE_NAMES_SHARP[noteIndex]}${octave}`;
    const isBlack = [1, 3, 6, 8, 10].includes(noteIndex);
    const keyNumber = midi - 35; // Key #1 (C2) through Key #61 (C7)
    keys.push({
      midi,
      keyNumber,
      note: noteName,
      isBlack
    });
  }
  return keys;
};

const PIANO_KEYS = generate61Keys();

// ============================================================================
// 2. CUSTOM SVG BRAND & UI ICONS
// ============================================================================

const CursiveMLogo = ({ size = 56, onClick, className = "" }) => (
  <button
    onClick={onClick}
    title="Toggle AI Music Assistant"
    className={`relative rounded-full flex items-center justify-center select-none transition-transform active:scale-95 shadow-lg focus:outline-none ${className}`}
    style={{
      width: size,
      height: size,
      background: 'radial-gradient(circle at 30% 25%, #8c28d6 0%, #4e118c 55%, #1c0845 100%)',
    }}
  >
    <svg
      viewBox="0 0 100 100"
      className="w-4/5 h-4/5 overflow-visible"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Stylized calligraphic cursive 'M' matching the reference image */}
      <path
        d="M 18 52 C 18 36, 26 28, 30 42 C 33 53, 34 68, 36 74 C 38 60, 46 28, 54 28 C 59 28, 59 52, 60 67 C 62 50, 72 24, 80 24 C 86 24, 83 45, 77 63 C 73 75, 74 84, 83 84"
        stroke="#ffffff"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
);

// ============================================================================
// 3. TONE.JS AUDIO ENGINE HOOK
// ============================================================================

function useToneEngine(volumePercent) {
  const [toneLoaded, setToneLoaded] = useState(false);
  const synthRef = useRef(null);
  const volumeNodeRef = useRef(null);
  const activeTimeoutsRef = useRef([]);

  // Dynamically load Tone.js from CDN if not already available
  useEffect(() => {
    if (window.Tone) {
      setToneLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js';
    script.async = true;
    script.onload = () => setToneLoaded(true);
    document.body.appendChild(script);
  }, []);

  // Initialize PolySynth and Volume Node once Tone is loaded
  const ensureSynth = useCallback(async () => {
    const Tone = window.Tone;
    if (!Tone) return null;

    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    if (!synthRef.current) {
      const volDb = volumePercent <= 0 ? -Infinity : (volumePercent / 100) * 30 - 24;
      const volNode = new Tone.Volume(volDb).toDestination();

      const polySynth = new Tone.PolySynth(Tone.Synth, {
        maxPolyphony: 32,
        oscillator: {
          type: 'triangle'
        },
        envelope: {
          attack: 0.015,
          decay: 0.15,
          sustain: 0.65,
          release: 0.45
        }
      }).connect(volNode);

      volumeNodeRef.current = volNode;
      synthRef.current = polySynth;
    }
    return synthRef.current;
  }, [volumePercent]);

  // Keep Tone.Volume updated with slider state
  useEffect(() => {
    if (volumeNodeRef.current && window.Tone) {
      const volDb = volumePercent <= 0 ? -Infinity : (volumePercent / 100) * 30 - 24;
      volumeNodeRef.current.volume.rampTo(volDb, 0.05);
    }
  }, [volumePercent]);

  // Preview a single note (when clicking a key or dragging a note bar)
  const previewNote = useCallback(async (noteName, duration = 0.25, velocity = 85) => {
    const synth = await ensureSynth();
    if (!synth) return;
    try {
      const velNormalized = Math.min(1, Math.max(0.1, velocity / 127));
      synth.triggerAttackRelease(noteName, duration, undefined, velNormalized);
    } catch (e) {
      // Ignore transient polyphony errors
    }
  }, [ensureSynth]);

  // Stop all scheduled notes immediately
  const stopAllAudio = useCallback(() => {
    activeTimeoutsRef.current.forEach((id) => clearTimeout(id));
    activeTimeoutsRef.current = [];
    if (synthRef.current) {
      try {
        synthRef.current.releaseAll();
      } catch (e) {}
    }
  }, []);

  // Schedule all notes from current playhead offset
  const scheduleNotesFromOffset = useCallback(async (notes, offsetSeconds) => {
    const synth = await ensureSynth();
    if (!synth) return;

    stopAllAudio();

    notes.forEach((n) => {
      const noteEnd = n.start + n.duration;
      // Note starts at or after current offset
      if (n.start >= offsetSeconds) {
        const delayMs = (n.start - offsetSeconds) * 1000;
        const timeoutId = setTimeout(() => {
          try {
            const vel = Math.min(1, Math.max(0.1, (n.velocity || 85) / 127));
            synth.triggerAttackRelease(n.note, Math.max(0.05, n.duration), undefined, vel);
          } catch (e) {}
        }, delayMs);
        activeTimeoutsRef.current.push(timeoutId);
      } else if (noteEnd > offsetSeconds) {
        // Note is already mid-sustain at current offset
        const remainingDuration = noteEnd - offsetSeconds;
        const timeoutId = setTimeout(() => {
          try {
            const vel = Math.min(1, Math.max(0.1, (n.velocity || 85) / 127));
            synth.triggerAttackRelease(n.note, Math.max(0.05, remainingDuration), undefined, vel);
          } catch (e) {}
        }, 0);
        activeTimeoutsRef.current.push(timeoutId);
      }
    });
  }, [ensureSynth, stopAllAudio]);

  return {
    toneLoaded,
    previewNote,
    stopAllAudio,
    scheduleNotesFromOffset
  };
}

// ============================================================================
// 4. MODULAR COMPONENT: TOP TOOLBAR
// ============================================================================

const TopToolbar = ({
  projectName,
  onProjectNameChange,
  isProjectReady,
  isPlaying,
  onPlay,
  onPause,
  onRewind,
  volume,
  onVolumeChange,
  onToggleAi
}) => {
  return (
    <header
      className="w-full h-[88px] px-6 flex items-center justify-between select-none shrink-0 z-20"
      style={{ backgroundColor: '#222222' }}
    >
      {/* Left Transport Controls: Play, Pause/Stop, Rewind (to start) */}
      <div className="flex items-center space-x-4">
        <Link
          to="/home"
          title="Go to home"
          className="rounded-lg border border-white/20 px-4 py-3 text-sm font-medium text-white no-underline transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Home
        </Link>

        {/* Play Button (Green Rounded Square) */}
        <button
          onClick={onPlay}
          title="Play"
          className={`w-[50px] h-[50px] rounded-[9px] flex items-center justify-center transition-all transform active:scale-95 shadow-md ${
            isPlaying ? 'ring-2 ring-white/70 brightness-110' : 'hover:brightness-110'
          }`}
          style={{ backgroundColor: '#52d13b' }}
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white ml-0.5">
            <path d="M6 4.5v15l13.5-7.5L6 4.5z" />
          </svg>
        </button>

        {/* Pause / Stop Button (Red Rounded Square) */}
        <button
          onClick={onPause}
          title="Pause"
          className="w-[50px] h-[50px] rounded-[9px] flex items-center justify-center transition-all transform active:scale-95 hover:brightness-110 shadow-md"
          style={{ backgroundColor: '#c92c2c' }}
        >
          <div className="w-[22px] h-[22px] bg-[#e5e5e5] rounded-[2px]" />
        </button>

        {/* Rewind to Start Button (Gold/Yellow Rounded Square) */}
        <button
          onClick={onRewind}
          title="Rewind to Start"
          className="w-[50px] h-[50px] rounded-[9px] flex items-center justify-center transition-all transform active:scale-95 hover:brightness-110 shadow-md"
          style={{ backgroundColor: '#d4a72c' }}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-8 h-8 stroke-white"
            fill="none"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <input
        type="text"
        aria-label="Project name"
        placeholder="Untitled Project"
        value={projectName}
        onChange={(event) => onProjectNameChange(event.target.value)}
        disabled={!isProjectReady}
        className="mx-4 min-w-0 max-w-64 flex-1 select-text rounded-lg border border-white/20 bg-[#171717] px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-white/50 focus:outline-none disabled:opacity-60"
      />

      {/* Right-Center Volume & AI Assistant Button */}
      <div className="flex items-center space-x-12">
        {/* Volume Control */}
        <div className="flex items-center space-x-4">
          {/* Speaker SVG Icon */}
          <button
            onClick={() => onVolumeChange(volume > 0 ? 0 : 48)}
            title={volume > 0 ? "Mute" : "Unmute"}
            className="text-[#e5e5e5] hover:text-white focus:outline-none transition-colors"
          >
            <svg viewBox="0 0 28 28" className="w-10 h-10 fill-current">
              <path d="M3 10.5v7h4.5l6 5.5V5L7.5 10.5H3z" />
              {volume > 0 && (
                <path
                  d="M17.5 9.5c1.5 1.2 2.5 2.8 2.5 4.5s-1 3.3-2.5 4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              )}
              {volume > 35 && (
                <path
                  d="M20.5 6c2.7 2.1 4.3 5 4.3 8s-1.6 5.9-4.3 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>

          {/* Custom Styled Volume Bar matching reference screenshot */}
          <div className="relative w-[220px] h-[15px] rounded-full bg-[#686868] flex items-center cursor-pointer">
            {/* Filled Left Track */}
            <div
              className="h-full rounded-l-full bg-[#dedede] pointer-events-none"
              style={{ width: `${volume}%` }}
            />
            {/* Slate-Blue Circular Thumb */}
            <div
              className="absolute w-[20px] h-[20px] rounded-full bg-[#777c96] shadow-md pointer-events-none -ml-[10px] transition-transform"
              style={{ left: `${volume}%` }}
            />
            {/* Invisible range input for smooth interaction */}
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              aria-label="Volume"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Circular AI Assistant Button */}
        <CursiveMLogo size={62} onClick={onToggleAi} />
      </div>
    </header>
  );
};

// ============================================================================
// 5. MODULAR COMPONENT: BLUE FRACTIONAL TIMELINE BAR (1/4s)
// ============================================================================

const TimelineHeader = ({
  scrollLeft,
  currentTime,
  onSeek
}) => {
  const headerRef = useRef(null);
  const isScrubbingRef = useRef(false);

  const quarterStepPx = QUARTER_INTERVAL * PIXELS_PER_SECOND; // 90px per 1/4 bar
  const totalWidth = TOTAL_QUARTERS * quarterStepPx;

  const updateTimeFromEvent = useCallback((clientX) => {
    if (!headerRef.current) return;
    const rect = headerRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left + scrollLeft;
    const newTime = Math.max(0, clickX / PIXELS_PER_SECOND);
    onSeek(newTime);
  }, [scrollLeft, onSeek]);

  const handleMouseDown = (e) => {
    isScrubbingRef.current = true;
    updateTimeFromEvent(e.clientX);

    const handleMouseMove = (moveEvent) => {
      if (isScrubbingRef.current) {
        updateTimeFromEvent(moveEvent.clientX);
      }
    };
    const handleMouseUp = () => {
      isScrubbingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="flex w-full h-[36px] shrink-0 select-none z-10 border-b border-black/30">
      {/* Top-Left Corner Header above the 61-key column */}
      <div
        className="shrink-0 h-full flex items-center justify-between px-3.5 text-[11px] font-semibold tracking-wider uppercase text-slate-300/80 border-r border-[#6f7087]"
        style={{
          width: KEY_COL_WIDTH,
          backgroundColor: '#252f38'
        }}
      >
        <span>Key (1-61)</span>
        <span>Note</span>
      </div>

      {/* Blue/Purple Fractional Bar Header (#535375) */}
      <div
        ref={headerRef}
        onMouseDown={handleMouseDown}
        className="relative flex-1 h-full overflow-hidden cursor-pointer"
        style={{ backgroundColor: '#535375' }}
        title="Click or drag to move playhead"
      >
        <div
          className="relative h-full"
          style={{
            width: totalWidth,
            transform: `translateX(-${scrollLeft}px)`
          }}
        >
          {Array.from({ length: TOTAL_QUARTERS }).map((_, idx) => {
            const xPos = idx * quarterStepPx;
            const fractionLabel = `${idx + 1}/4`;
            return (
              <div
                key={idx}
                className="absolute top-0 bottom-0 border-l border-[#7f809c]/70 flex items-center pl-2"
                style={{ left: xPos, width: quarterStepPx }}
              >
                <span className="text-[12px] font-medium text-white/90 tracking-tight">
                  {fractionLabel}
                </span>
              </div>
            );
          })}

          {/* Playhead line indicator inside the blue timeline header */}
          <div
            className="absolute top-0 bottom-0 w-[3px] pointer-events-none z-20"
            style={{
              left: currentTime * PIXELS_PER_SECOND,
              backgroundColor: '#4be32b'
            }}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 6. MODULAR COMPONENT: DRAGGABLE & RESIZABLE NOTE BAR (NO GRID SNAPPING)
// ============================================================================

const NoteBar = ({
  noteObj,
  rowIndex,
  isSelected,
  onSelect,
  onUpdateNote,
  onDeleteNote,
  onPreviewNote
}) => {
  const leftPx = noteObj.start * PIXELS_PER_SECOND;
  const widthPx = Math.max(18, noteObj.duration * PIXELS_PER_SECOND);
  const topPx = rowIndex * ROW_HEIGHT + 1;
  const heightPx = ROW_HEIGHT - 2;

  // Handle Free Dragging of Note Body (Horizontal & Vertical without Grid Snapping)
  const handleBodyMouseDown = (e) => {
    e.stopPropagation();
    if (e.button === 2) return; // Right click handled by context menu
    onSelect(noteObj.id);
    onPreviewNote(noteObj.note, 0.2, noteObj.velocity);

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const initialStart = noteObj.start;
    const initialPitch = noteObj.pitch;
    let lastPreviewedPitch = initialPitch;

    const handleMouseMove = (moveEvt) => {
      const deltaX = moveEvt.clientX - startMouseX;
      const deltaY = moveEvt.clientY - startMouseY;

      // Free floating-point time (NO snapping to grid!)
      const rawNewStart = Math.max(0, initialStart + deltaX / PIXELS_PER_SECOND);
      const newStart = Number(rawNewStart.toFixed(4));

      // Vertical key row change
      const pitchShift = -Math.round(deltaY / ROW_HEIGHT);
      const newPitch = Math.min(96, Math.max(36, initialPitch + pitchShift));
      const matchedKey = PIANO_KEYS.find((k) => k.midi === newPitch);
      const newNoteName = matchedKey ? matchedKey.note : noteObj.note;

      if (newPitch !== lastPreviewedPitch && matchedKey) {
        lastPreviewedPitch = newPitch;
        onPreviewNote(newNoteName, 0.15, noteObj.velocity);
      }

      onUpdateNote(noteObj.id, {
        start: newStart,
        pitch: newPitch,
        note: newNoteName
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Handle Free Left-Edge Resize (No Grid Snapping)
  const handleLeftResizeMouseDown = (e) => {
    e.stopPropagation();
    onSelect(noteObj.id);

    const startMouseX = e.clientX;
    const initialStart = noteObj.start;
    const initialDuration = noteObj.duration;
    const endTime = initialStart + initialDuration;

    const handleMouseMove = (moveEvt) => {
      const deltaSeconds = (moveEvt.clientX - startMouseX) / PIXELS_PER_SECOND;
      const newStart = Math.max(0, Math.min(endTime - 0.08, initialStart + deltaSeconds));
      const newDuration = Math.max(0.08, endTime - newStart);

      onUpdateNote(noteObj.id, {
        start: Number(newStart.toFixed(4)),
        duration: Number(newDuration.toFixed(4))
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Handle Free Right-Edge Resize (No Grid Snapping)
  const handleRightResizeMouseDown = (e) => {
    e.stopPropagation();
    onSelect(noteObj.id);

    const startMouseX = e.clientX;
    const initialDuration = noteObj.duration;

    const handleMouseMove = (moveEvt) => {
      const deltaSeconds = (moveEvt.clientX - startMouseX) / PIXELS_PER_SECOND;
      const newDuration = Math.max(0.08, initialDuration + deltaSeconds);

      onUpdateNote(noteObj.id, {
        duration: Number(newDuration.toFixed(4))
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      onMouseDown={handleBodyMouseDown}
      onContextMenu={(e) => {
        e.preventDefault();
        onDeleteNote(noteObj.id);
      }}
      title={`${noteObj.note} | Start: ${noteObj.start.toFixed(2)}s | Dur: ${noteObj.duration.toFixed(2)}s (Drag freely, Right-click to delete)`}
      className={`group absolute select-none cursor-grab active:cursor-grabbing flex items-center justify-between transition-shadow ${
        isSelected ? 'ring-2 ring-white/90 z-10' : 'z-[5]'
      }`}
      style={{
        left: leftPx,
        top: topPx,
        width: widthPx,
        height: heightPx,
        backgroundColor: '#8be0ff',
        borderRadius: '2px'
      }}
    >
      {/* Left Dark Teal Pill Handle (exact match to screenshot) */}
      <div
        onMouseDown={handleLeftResizeMouseDown}
        className="w-[10px] h-[34px] -ml-[4px] rounded-full cursor-ew-resize shrink-0 hover:brightness-125 transition-all"
        style={{ backgroundColor: '#194f56' }}
      />

      {/* Subtle Note Label when wide enough */}
      {widthPx > 52 && (
        <span className="text-[11px] font-bold text-[#103840]/80 pointer-events-none truncate px-1">
          {noteObj.note}
        </span>
      )}

      {/* Right Dark Teal Pill Handle (exact match to screenshot) */}
      <div
        onMouseDown={handleRightResizeMouseDown}
        className="w-[10px] h-[34px] -mr-[4px] rounded-full cursor-ew-resize shrink-0 hover:brightness-125 transition-all"
        style={{ backgroundColor: '#194f56' }}
      />
    </div>
  );
};

// ============================================================================
// 7. MODULAR COMPONENT: 61-KEY PIANO COLUMN & PIANO ROLL GRID
// ============================================================================

const PianoRollWorkspace = ({
  notes,
  currentTime,
  selectedNoteId,
  onSelectNote,
  onUpdateNote,
  onAddNote,
  onDeleteNote,
  onPreviewNote,
  onScrollLeftChange
}) => {
  const scrollContainerRef = useRef(null);
  const [activeKeyMidi, setActiveKeyMidi] = useState(null);

  const quarterStepPx = QUARTER_INTERVAL * PIXELS_PER_SECOND;
  const totalGridWidth = TOTAL_QUARTERS * quarterStepPx;
  const totalGridHeight = PIANO_KEYS.length * ROW_HEIGHT;

  // On initial mount, scroll vertically so the example notes (around D5 to D3) are in view
  useEffect(() => {
    if (scrollContainerRef.current) {
      // MIDI 76 (E5) is index 20 -> scroll so D5 (74) is near the top like the screenshot
      const initialRowIndex = PIANO_KEYS.findIndex((k) => k.midi === 75);
      if (initialRowIndex !== -1) {
        scrollContainerRef.current.scrollTop = initialRowIndex * ROW_HEIGHT;
      }
    }
  }, []);

  // Determine which notes are actively sounding at `currentTime` for visual feedback
  const activePlayingMidis = useMemo(() => {
    const set = new Set();
    if (currentTime > 0) {
      notes.forEach((n) => {
        if (currentTime >= n.start && currentTime <= n.start + n.duration) {
          set.add(n.pitch);
        }
      });
    }
    return set;
  }, [notes, currentTime]);

  // Double-click empty grid space to add a new note at that exact position
  const handleGridDoubleClick = (e) => {
    if (!scrollContainerRef.current) return;
    const gridRect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - gridRect.left;
    const clickY = e.clientY - gridRect.top;

    const rowIndex = Math.floor(clickY / ROW_HEIGHT);
    const keyInfo = PIANO_KEYS[rowIndex];
    if (!keyInfo) return;

    const startTime = Number(Math.max(0, clickX / PIXELS_PER_SECOND).toFixed(3));
    const newNote = {
      id: `m_${Date.now()}`,
      pitch: keyInfo.midi,
      note: keyInfo.note,
      start: startTime,
      duration: 0.45,
      velocity: 88
    };

    onAddNote(newNote);
    onPreviewNote(keyInfo.note, 0.3, 88);
  };

  return (
    <div
      ref={scrollContainerRef}
      onScroll={(e) => onScrollLeftChange(e.currentTarget.scrollLeft)}
      className="flex-1 flex overflow-auto relative select-none"
      style={{ backgroundColor: '#16171d' }}
    >
      {/* Left Sticky Column: 61 Keys displaying Key Number & Note Name */}
      <div
        className="sticky left-0 z-10 shrink-0 border-r border-[#6f7087]"
        style={{
          width: KEY_COL_WIDTH,
          height: totalGridHeight
        }}
      >
        {PIANO_KEYS.map((keyObj, idx) => {
          const isEven = idx % 2 === 0;
          const isHighlighted =
            activeKeyMidi === keyObj.midi || activePlayingMidis.has(keyObj.midi);

          return (
            <div
              key={keyObj.midi}
              onMouseDown={() => {
                setActiveKeyMidi(keyObj.midi);
                onPreviewNote(keyObj.note, 0.35, 90);
              }}
              onMouseUp={() => setActiveKeyMidi(null)}
              onMouseLeave={() => setActiveKeyMidi(null)}
              style={{
                height: ROW_HEIGHT,
                backgroundColor: isHighlighted
                  ? '#3b5266'
                  : isEven
                  ? '#26303a'
                  : '#1f2830'
              }}
              className="w-full px-3.5 flex items-center justify-between cursor-pointer border-b border-black/20 transition-colors hover:brightness-110"
            >
              {/* Key Number (1 to 61) & MIDI pitch badge */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono text-slate-400/90 w-6">
                  #{keyObj.keyNumber}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  ({keyObj.midi})
                </span>
              </div>

              {/* Note Name (e.g. D5, A4, Bb2) with subtle accidental styling */}
              <div className="flex items-center space-x-1.5">
                {keyObj.isBlack && (
                  <span className="w-2 h-2 rounded-full bg-sky-400/60 inline-block" />
                )}
                <span
                  className={`text-[13px] font-semibold tracking-wide ${
                    keyObj.note.startsWith('C') && !keyObj.isBlack
                      ? 'text-sky-300'
                      : keyObj.isBlack
                      ? 'text-slate-300'
                      : 'text-slate-100'
                  }`}
                >
                  {keyObj.note}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right Piano Roll Grid Container */}
      <div
        onMouseDown={() => onSelectNote(null)}
        onDoubleClick={handleGridDoubleClick}
        className="relative"
        style={{
          width: totalGridWidth,
          height: totalGridHeight
        }}
      >
        {/* Horizontal Alternating Key Rows */}
        {PIANO_KEYS.map((keyObj, idx) => {
          const isEven = idx % 2 === 0;
          return (
            <div
              key={keyObj.midi}
              style={{
                height: ROW_HEIGHT,
                backgroundColor: isEven ? '#1d1e26' : '#16171d'
              }}
              className="w-full border-b border-[#292a34]/70"
            />
          );
        })}

        {/* Vertical 1/4 Fractional Subdivision Lines */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: TOTAL_QUARTERS }).map((_, idx) => (
            <div
              key={idx}
              className="absolute top-0 bottom-0 border-l border-[#68697a]/60"
              style={{ left: idx * quarterStepPx }}
            />
          ))}
        </div>

        {/* Draggable & Resizable Note Bars */}
        {notes.map((noteObj) => {
          const rowIndex = PIANO_KEYS.findIndex((k) => k.midi === noteObj.pitch);
          if (rowIndex === -1) return null;
          return (
            <NoteBar
              key={noteObj.id}
              noteObj={noteObj}
              rowIndex={rowIndex}
              isSelected={selectedNoteId === noteObj.id}
              onSelect={onSelectNote}
              onUpdateNote={onUpdateNote}
              onDeleteNote={onDeleteNote}
              onPreviewNote={onPreviewNote}
            />
          );
        })}

        {/* Bright Green Vertical Playhead Line */}
        <div
          className="absolute top-0 bottom-0 w-[3px] pointer-events-none z-20"
          style={{
            left: currentTime * PIXELS_PER_SECOND,
            backgroundColor: '#4be32b',
            boxShadow: '0 0 8px rgba(75, 227, 43, 0.55)'
          }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// 8. MODULAR COMPONENT: AI ASSISTANT OVERLAY SIDEBAR
// ============================================================================

const AiAssistantSidebar = ({
  isOpen,
  onClose,
  notes,
  onSetNotes
}) => {
  const [messages, setMessages] = useState([
    { id: 'welcome', sender: 'ai', text: 'Hi! how can I help?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const userMsg = { id: `u_${Date.now()}`, sender: 'user', text: trimmed };
    const lower = trimmed.toLowerCase();
    let replyText =
      "I can help you compose! Try asking me to 'reset notes', 'harmonize melody', 'shift octave up', or 'add arpeggio'. Notice you can also drag any note bar freely without grid snapping!";

    if (lower.includes('reset') || lower.includes('default') || lower.includes('original')) {
      onSetNotes(INITIAL_NOTES);
      replyText = "Restored the original 12-note D minor melody and bass progression!";
    } else if (lower.includes('clear') || lower.includes('delete all')) {
      onSetNotes([]);
      replyText = "Cleared the piano roll. Double-click anywhere on the grid to place new notes!";
    } else if (lower.includes('octave up') || lower.includes('higher')) {
      onSetNotes(
        notes.map((n) => {
          const newPitch = Math.min(96, n.pitch + 12);
          const key = PIANO_KEYS.find((k) => k.midi === newPitch);
          return { ...n, pitch: newPitch, note: key ? key.note : n.note };
        })
      );
      replyText = "Shifted all notes up by 1 octave (+12 semitones).";
    } else if (lower.includes('octave down') || lower.includes('lower')) {
      onSetNotes(
        notes.map((n) => {
          const newPitch = Math.max(36, n.pitch - 12);
          const key = PIANO_KEYS.find((k) => k.midi === newPitch);
          return { ...n, pitch: newPitch, note: key ? key.note : n.note };
        })
      );
      replyText = "Shifted all notes down by 1 octave (-12 semitones).";
    } else if (lower.includes('harmonize') || lower.includes('chord') || lower.includes('add')) {
      const extraNotes = [
        { id: `ai_${Date.now()}_1`, pitch: 77, note: "F5", start: 0.7, duration: 0.6, velocity: 82 },
        { id: `ai_${Date.now()}_2`, pitch: 72, note: "C5", start: 1.4, duration: 0.5, velocity: 80 },
        { id: `ai_${Date.now()}_3`, pitch: 70, note: "Bb4", start: 2.5, duration: 0.4, velocity: 80 }
      ];
      onSetNotes([...notes, ...extraNotes]);
      replyText = "Added upper third harmonies (F5, C5, Bb4) to enrich your lead melody!";
    }

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: `ai_${Date.now()}`, sender: 'ai', text: replyText }
    ]);
    setInputValue('');
  };

  return (
    <aside
      className="fixed top-1.5 bottom-1.5 right-0 w-[335px] sm:w-[355px] rounded-l-[30px] shadow-2xl z-40 flex flex-col justify-between p-4 select-none transition-all duration-200"
      style={{ backgroundColor: '#cccccc' }}
    >
      {/* Top Chat Area with M Avatar & Message Bubble (Matches Screenshot 2) */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {messages.map((msg, index) => {
          if (msg.sender === 'ai') {
            return (
              <div key={msg.id} className="flex items-start space-x-3.5 pt-2">
                {/* Clicking the M avatar in the sidebar closes the sidebar */}
                <div className="shrink-0">
                  <CursiveMLogo
                    size={58}
                    onClick={index === 0 ? onClose : undefined}
                  />
                </div>
                <div
                  className="px-5 py-3.5 rounded-[12px] text-white text-[17px] leading-snug shadow-sm flex-1"
                  style={{ backgroundColor: '#2e303e' }}
                >
                  {msg.text}
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className="flex justify-end">
              <div className="px-4 py-2.5 rounded-[12px] bg-[#4a4d63] text-white text-[15px] max-w-[82%] shadow-sm">
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Action Pills for Easy Testing */}
      <div className="flex flex-wrap gap-1.5 my-2.5 px-1">
        {[
          { label: 'Harmonize', cmd: 'Harmonize melody' },
          { label: 'Octave +1', cmd: 'Shift octave up' },
          { label: 'Reset Demo', cmd: 'Reset notes' }
        ].map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => setInputValue(chip.cmd)}
            className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-neutral-700/80 text-white hover:bg-neutral-800 transition"
          >
            {chip.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-neutral-500/80 text-white hover:bg-neutral-600 ml-auto transition"
        >
          Close
        </button>
      </div>

      {/* Bottom Dark Input Box matching Screenshot 2 */}
      <form onSubmit={handleSendMessage} className="w-full pt-1">
        <div
          className="w-full h-[54px] rounded-[11px] flex items-center px-4 shadow-inner"
          style={{ backgroundColor: '#363434' }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder=""
            autoFocus
            className="w-full bg-transparent text-white text-[18px] caret-white focus:outline-none"
          />
        </div>
      </form>
    </aside>
  );
};

// ============================================================================
// 9. MAIN APPLICATION COMPONENT
// ============================================================================

export default function ProdPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [projectContext, setProjectContext] = useState(null);
  const [projectLoadState, setProjectLoadState] = useState(null);
  const [saveError, setSaveError] = useState('');
  const loadRequestRef = useRef({ key: null, promise: null });
  const lastSavedNotesRef = useRef(null);
  const lastSavedProjectNameRef = useRef(null);
  const saveQueueRef = useRef(Promise.resolve());
  const requestKey = projectId ?? 'new';
  const isProjectReady =
    projectLoadState?.key === requestKey && projectLoadState.ready;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0.5); // Starts positioned like the reference green playhead
  const [volume, setVolume] = useState(48);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  const {
    previewNote,
    stopAllAudio,
    scheduleNotesFromOffset
  } = useToneEngine(volume);

  const animFrameRef = useRef(null);
  const playbackStartRef = useRef({ wallClockMs: 0, startOffsetSec: 0 });

  useEffect(() => {
    let isMounted = true;

    if (loadRequestRef.current.key !== requestKey) {
      loadRequestRef.current = {
        key: requestKey,
        promise: (async () => {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
          if (!user) {
            return { requiresAuthentication: true };
          }

          if (projectId) {
            const { data: existingProject, error: projectError } = await supabase
              .from('projects')
              .select('id, project_name, image, song')
              .eq('id', projectId)
              .eq('user_id', user.id)
              .maybeSingle();

            if (projectError) throw projectError;
            if (existingProject) {
              return { project: existingProject, userId: user.id, isNew: false };
            }
          }

          const { data: newProject, error: insertError } = await supabase
            .from('projects')
            .insert({
              project_name: 'Untitled Project',
              image: '',
              user_id: user.id,
              song: { notes: INITIAL_NOTES },
            })
            .select('id, project_name, image, song')
            .single();

          if (insertError) throw insertError;
          return { project: newProject, userId: user.id, isNew: true };
        })(),
      };
    }

    loadRequestRef.current.promise
      .then((result) => {
        if (!isMounted) return;

        if (result.requiresAuthentication) {
          navigate('/authentication', { replace: true });
          return;
        }

        const projectNotes = result.isNew ? INITIAL_NOTES : readNotes(result.project.song);
        lastSavedNotesRef.current = JSON.stringify(projectNotes);
        const loadedProjectName = result.project.project_name || 'Untitled Project';
        lastSavedProjectNameRef.current = loadedProjectName;
        setNotes(projectNotes);
        setProjectName(loadedProjectName);
        setProjectContext({ id: result.project.id, userId: result.userId });
        setProjectLoadState({ key: requestKey, ready: true, error: '' });
        setSaveError('');

        if (result.isNew) {
          navigate(`/projects/${result.project.id}`, { replace: true });
        }
      })
      .catch((loadError) => {
        if (isMounted) {
          setProjectLoadState({
            key: requestKey,
            ready: false,
            error: loadError.message || 'Unable to load or create this project.',
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [navigate, projectId, requestKey]);

  useEffect(() => {
    if (!isProjectReady || !projectContext) return undefined;

    const serializedNotes = JSON.stringify(notes);
    if (serializedNotes === lastSavedNotesRef.current) return undefined;

    let isActive = true;
    const timeoutId = setTimeout(() => {
      saveQueueRef.current = saveQueueRef.current
        .then(async () => {
        const { data: updatedProject, error: updateError } = await supabase
            .from('projects')
            .update({
              song: { notes },
              updated_at: new Date().toISOString(),
            })
            .eq('id', projectContext.id)
          .eq('user_id', projectContext.userId)
          .select('id')
          .maybeSingle();

        if (updateError) throw updateError;
        if (!updatedProject) throw new Error('Project could not be saved.');
        lastSavedNotesRef.current = serializedNotes;
          if (isActive) setSaveError('');
        })
        .catch((updateError) => {
          if (isActive) {
            setSaveError(updateError.message || 'Unable to save project changes.');
          }
        });
    }, 500);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [isProjectReady, notes, projectContext]);

  useEffect(() => {
    if (!isProjectReady || !projectContext) return undefined;
    if (projectName === lastSavedProjectNameRef.current) return undefined;

    let isActive = true;
    const timeoutId = setTimeout(() => {
      saveQueueRef.current = saveQueueRef.current
        .then(async () => {
          const { data: updatedProject, error: updateError } = await supabase
            .from('projects')
            .update({
              project_name: projectName,
              updated_at: new Date().toISOString(),
            })
            .eq('id', projectContext.id)
            .eq('user_id', projectContext.userId)
            .select('id')
            .maybeSingle();

          if (updateError) throw updateError;
          if (!updatedProject) throw new Error('Project name could not be saved.');
          lastSavedProjectNameRef.current = projectName;
          if (isActive) setSaveError('');
        })
        .catch((updateError) => {
          if (isActive) {
            setSaveError(updateError.message || 'Unable to save the project name.');
          }
        });
    }, 500);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [isProjectReady, projectContext, projectName]);

  // Calculate sequence end time (with comfortable tail buffer)
  const sequenceEndTime = useMemo(() => {
    if (notes.length === 0) return 6.0;
    const maxEnd = Math.max(...notes.map((n) => n.start + n.duration));
    return Math.max(5.0, maxEnd + 0.5);
  }, [notes]);

  // Smooth 60fps Playhead Animation Loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const updatePlayhead = () => {
      const elapsedSec = (performance.now() - playbackStartRef.current.wallClockMs) / 1000;
      const nextTime = playbackStartRef.current.startOffsetSec + elapsedSec;

      if (nextTime >= sequenceEndTime) {
        setIsPlaying(false);
        stopAllAudio();
        setCurrentTime(0);
        return;
      }

      setCurrentTime(nextTime);
      animFrameRef.current = requestAnimationFrame(updatePlayhead);
    };

    animFrameRef.current = requestAnimationFrame(updatePlayhead);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, sequenceEndTime, stopAllAudio]);

  // Play Handler
  const handlePlay = useCallback(async () => {
    if (isPlaying) return;
    const startOffset = currentTime >= sequenceEndTime - 0.1 ? 0 : currentTime;
    setCurrentTime(startOffset);

    playbackStartRef.current = {
      wallClockMs: performance.now(),
      startOffsetSec: startOffset
    };

    await scheduleNotesFromOffset(notes, startOffset);
    setIsPlaying(true);
  }, [isPlaying, currentTime, sequenceEndTime, notes, scheduleNotesFromOffset]);

  // Pause Handler
  const handlePause = useCallback(() => {
    setIsPlaying(false);
    stopAllAudio();
  }, [stopAllAudio]);

  // Rewind (to start) Handler
  const handleRewind = useCallback(() => {
    setIsPlaying(false);
    stopAllAudio();
    setCurrentTime(0);
  }, [stopAllAudio]);

  // Seek Playhead from Blue Fractional Bar
  const handleSeek = useCallback(
    async (newTimeSec) => {
      setCurrentTime(newTimeSec);
      if (isPlaying) {
        playbackStartRef.current = {
          wallClockMs: performance.now(),
          startOffsetSec: newTimeSec
        };
        await scheduleNotesFromOffset(notes, newTimeSec);
      }
    },
    [isPlaying, notes, scheduleNotesFromOffset]
  );

  // Update a single note's start, duration, or pitch (no grid snapping)
  const handleUpdateNote = useCallback((id, changes) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, ...changes } : note))
    );
  }, []);

  // Add a new note on double click
  const handleAddNote = useCallback((newNote) => {
    setNotes((prev) => [...prev, newNote]);
    setSelectedNoteId(newNote.id);
  }, []);

  // Delete a note on right click
  const handleDeleteNote = useCallback((id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setSelectedNoteId((prevId) => (prevId === id ? null : prevId));
  }, []);

  if (!isProjectReady) {
    const projectError =
      projectLoadState?.key === requestKey ? projectLoadState.error : '';

    return (
      <main className="grid h-screen place-items-center bg-[#16171d] p-6 text-white">
        <p role={projectError ? 'alert' : 'status'}>
          {projectError || 'Loading project…'}
        </p>
      </main>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-[#16171d] font-sans">
      {saveError && (
        <p role="alert" className="absolute left-1/2 top-2 z-50 -translate-x-1/2 rounded-lg bg-red-900 px-4 py-2 text-sm text-white">
          {saveError}
        </p>
      )}
      {/* 1. Top Transport, Volume & AI Button Toolbar */}
      <TopToolbar
        projectName={projectName}
        onProjectNameChange={setProjectName}
        isProjectReady={isProjectReady}
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onPause={handlePause}
        onRewind={handleRewind}
        volume={volume}
        onVolumeChange={setVolume}
        onToggleAi={() => setIsAiSidebarOpen((prev) => !prev)}
      />

      {/* 2. Blue Fractional Bar Header (1/4s) */}
      <TimelineHeader
        scrollLeft={scrollLeft}
        currentTime={currentTime}
        onSeek={handleSeek}
      />

      {/* 3. Main 61-Key Piano Roll & Free-Dragging Note Grid */}
      <PianoRollWorkspace
        notes={notes}
        currentTime={currentTime}
        selectedNoteId={selectedNoteId}
        onSelectNote={setSelectedNoteId}
        onUpdateNote={handleUpdateNote}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
        onPreviewNote={previewNote}
        onScrollLeftChange={setScrollLeft}
      />

      {/* 4. Right Overlay AI Assistant Sidebar */}
      <AiAssistantSidebar
        isOpen={isAiSidebarOpen}
        onClose={() => setIsAiSidebarOpen(false)}
        notes={notes}
        onSetNotes={setNotes}
      />
    </div>
  );
}