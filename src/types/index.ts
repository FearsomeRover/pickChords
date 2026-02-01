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
  tablature?: string; // alphaTex format
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
