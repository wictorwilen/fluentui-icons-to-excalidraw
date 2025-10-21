// Core data types
export interface Icon {
  id: string;
  name: string;
  displayName: string;
  category: string;
  style: 'regular' | 'filled' | 'light';
  keywords: string[];
  excalidrawPath: string;
  svgPath?: string;
  tags?: string[];
}

export interface Emoji {
  id: string;
  name: string;
  displayName: string;
  category: string;
  style: 'flat' | 'color';
  keywords: string[];
  excalidrawPath: string;
  svgPath?: string;
  unicode?: string;
  codepoint?: string;
  tags?: string[];
}

export interface Category {
  id: string;
  name: string;
  displayName: string;
  iconCount: number;
  emojiCount: number;
  totalCount: number;
  description?: string;
  keywords?: string[];
}

// Search and filtering types
export interface SearchFilters {
  query: string;
  category: string | null;
  styles: ('regular' | 'filled' | 'light' | 'flat' | 'color')[];
  type: 'all' | 'icons' | 'emojis';
}

export interface SearchResult {
  icons: Icon[];
  emojis: Emoji[];
  totalCount: number;
  hasMore: boolean;
}

// Data loading types
export interface IconMetadata {
  icons: Icon[];
  categories: Category[];
  totalCount: number;
  lastUpdated: string;
}

export interface EmojiMetadata {
  emojis: Emoji[];
  categories: Category[];
  totalCount: number;
  lastUpdated: string;
}

// UI state types
export interface AppState {
  icons: Icon[];
  emojis: Emoji[];
  categories: Category[];
  searchFilters: SearchFilters;
  selectedIcon: Icon | null;
  selectedEmoji: Emoji | null;
  isLoading: boolean;
  error: string | null;
  sidebarOpen: boolean;
  darkMode: boolean;
}

// Component prop types
export interface BaseProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
  progress?: number;
}

// Download and export types
export interface DownloadOptions {
  format: 'excalidraw' | 'svg' | 'png';
  size?: number;
  includeBackground?: boolean;
}

export interface ExportResult {
  success: boolean;
  data?: string | Blob;
  error?: string;
  filename?: string;
}
