export interface ParsedLocation {
  timestamp_ms: number;
  lat: number;
  long: number;
//   altitude: number;
  accuracy: number;
  raw_message: string;
}

export interface LogEntry {
  id: number;
  timestamp_ms: number;
  lat: number;
  long: number;
  altitude?: number;
  accuracy: number;
  dist_meters: number;
  raw_message: string;
}

export interface Coordinates {
  lat: number;
  long: number;
}
