export interface MemoryMetadata {
  id: string;
  title: string;
  tags: string[];
  mood: "happy" | "nostalgic" | "reflective" | "excited";
  mediaUrl?: string;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
}

export interface LocationData {
  id: string;
  cityName: string;
  latitude: number;
  longitude: number;
}

// The unified object you'll use in your React components
export interface CombinedMemory
  extends MemoryMetadata, JournalEntry, LocationData {}
