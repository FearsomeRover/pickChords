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

export interface Song {
  id: number;
  name: string;
  artist?: string;
  notes?: string;
  chord_ids: number[];
  tag_ids: number[];
  chords?: Chord[];
  tags?: Tag[];
  is_favorite?: boolean;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}
