export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  UNKNOWN = 'UNKNOWN'
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: MediaType;
  size?: string;
  date?: string;
  lat?: number | null;
  lng?: number | null;
  hasCheckedExif?: boolean;
}

export interface ParseResult {
  items: MediaItem[];
  error?: string;
}