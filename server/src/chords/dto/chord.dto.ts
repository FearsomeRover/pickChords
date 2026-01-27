export interface StringData {
  fret: number | 'x';
  finger?: number;
}

export interface ChordDto {
  id: number;
  name: string;
  strings: StringData[];
  start_fret: number;
  created_at: string;
}
