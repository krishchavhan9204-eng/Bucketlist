export interface HouseholdTransaction {
  Date: string; // "20/09/2018 12:04:08"
  Category: string; // "Transportation"
  Amount: number; // 30
}

export interface SpotifyHistoryItem {
  ts: string; // "2013-07-08 02:44:34"
  track_name: string; // "Say It, Just Say It"
  artist_name: string; // "The Mowgli's"
  ms_played: number; // 3185
}

export interface SpotifyDictionaryRow {
  trackName: string;
  energy: number;
  tempo: number;
  valence: number;
}

export interface DailyLifeSnapshot {
  date: string;
  totalSpent: number;
  transactionCount: number;
  totalMusicMinutes: number;
  averageEnergy: number;
  averageValence: number;
}
