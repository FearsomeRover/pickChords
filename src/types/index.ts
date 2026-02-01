export interface StringData {
  fret: number | 'x';
  finger?: number;
}

export interface Chord {
  id: number;
  name: string;
  strings: StringData[];
  start_fret: number;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

// Stroke types for strumming patterns
export type StrokeType = 'down' | 'up' | 'mute_down' | 'mute_up' | 'accent_down' | 'accent_up' | 'rest' | 'skip';

// Tablature types
export type TabTechnique = 'h' | 'p' | '/' | '\\' | '~' | 'b' | 'r'; // hammer-on, pull-off, slide up/down, vibrato, bend, release

export interface TabNote {
  fret: number | null;        // null = no note, 0-24 = fret number
  technique?: TabTechnique;   // technique applied to this note
}

export interface TabString {
  notes: (TabNote | null)[];  // array of notes for this string in a measure
}

export interface TabMeasure {
  chordName?: string;         // chord name displayed above measure (e.g., "Fmaj7", "G6")
  strings: TabString[];       // 6 strings (index 0 = high E, index 5 = low E)
  timingMarkers?: string[];   // e.g., ["1", "e", "+", "a", "2", "e", "+", "a", ...]
}

export interface TabSection {
  name: string;               // section name (e.g., "Verse 1", "Chorus", "Intro")
  tempo?: number;             // BPM
  timeSignature?: string;     // e.g., "4/4", "3/4"
  instructions?: string[];    // e.g., ["let ring", "palm mute"]
  measures: TabMeasure[];
}

export interface SongTablature {
  sections: TabSection[];
  tuning?: string[];          // e.g., ["E", "A", "D", "G", "B", "E"] (standard) or custom
  rawText?: string;           // optional raw ASCII tab text for simple storage/display
}

export interface StrummingPattern {
  strokes: StrokeType[];
  tempo: number;
  noteLength: '1/4' | '1/8' | '1/8 triplet' | '1/16' | '1/16 triplet';
  songPart?: string;
}

export interface Song {
  id: number;
  name: string;
  artist?: string;
  notes?: string;
  chord_ids: number[];
  tag_ids: number[];
  chords?: Chord[];
  tags?: Tag[];
  strumming_pattern?: StrummingPattern;
  capo?: number;
  links?: string[];
  tablature?: SongTablature;
  user_id?: number;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  is_admin: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateAuth: (user: User, token: string) => void;
}

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  id: number;
  level: LogLevel;
  action: string;
  message: string;
  user_id: number | null;
  username: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export type ProgressStatus = 'want_to_learn' | 'learning' | 'practicing' | 'mastered';

export interface SongProgress {
  id: number;
  user_id: number;
  song_id: number;
  status: ProgressStatus;
  position: number;
  created_at: string;
  updated_at: string;
  song_name?: string;
  song_artist?: string;
  chord_count?: number;
}
