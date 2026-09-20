export interface HouseholdTransaction {
  date: string; // YYYY-MM-DD
  amount: number;
  category:
    | "Groceries"
    | "Utilities"
    | "Rent"
    | "Entertainment"
    | "Maintenance";
}

export interface SpotifyHistoryItem {
  endTime: string; // YYYY-MM-DD HH:MM
  artistName: string;
  trackName: string;
  msPlayed: number;
}

export interface AudioFeatures {
  tempo: number; // BPM
  energy: number; // 0 to 1
  valence: number; // 0 to 1 (Happiness/Positivity)
}

// Data dictionary maps Track Name or Artist Name to audio metrics
export type SpotifyDictionary = Record<string, AudioFeatures>;

// Combined daily snapshot for insights
export interface DailyLifeSnapshot {
  date: string;
  totalSpent: number;
  transactionCount: number;
  totalMusicMinutes: number;
  averageEnergy: number;
  averageValence: number;
}
