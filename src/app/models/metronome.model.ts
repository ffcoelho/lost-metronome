
export interface MetronomeSettings {
  beats: number;
  note: NoteValue;
  bpm: number;
}

export interface Beat {
  beat: number;
  time: number;
}

export enum NoteValue {
  WHOLE = 0.25,
  HALF = 0.5,
  QUARTER = 1,
  EIGHTH = 2
}

export const INITIAL_METRONOME_SETTINGS: MetronomeSettings = {
  bpm: 67,
  beats: 4,
  note: NoteValue.QUARTER,
}
