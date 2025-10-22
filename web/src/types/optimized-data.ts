// Optimized data types for the compressed icon format

export interface OptimizedIconsData {
  meta: {
    totalCount: number;
    lastUpdated: string;
    version: string;
    compression: {
      categories: string[];
      styles: string[];
      commonPaths: string[];
    };
  };
  icons: OptimizedIcon[];
}

export interface OptimizedIcon {
  i: string; // id
  n: string; // name
  d: string; // displayName
  c: number; // category (index into categories array)
  s: number; // style (index into styles array)
  k: string[]; // keywords (compressed)
  e: string; // excalidrawPath (compressed)
}

export interface SearchIndex {
  index: SearchEntry[];
}

export interface SearchEntry {
  i: string; // icon id
  t: string; // searchable text
}

export interface CategoriesData {
  categories: Category[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

// Helper functions to decompress data
export class DataDecompressor {
  private categories: string[];
  private styles: string[];
  private commonPaths: string[];

  constructor(compressionData: OptimizedIconsData['meta']['compression']) {
    this.categories = compressionData.categories;
    this.styles = compressionData.styles;
    this.commonPaths = compressionData.commonPaths;
  }

  decompressIcon(icon: OptimizedIcon): DecompressedIcon {
    return {
      id: icon.i,
      name: icon.n,
      displayName: icon.d,
      category: this.categories[icon.c],
      style: this.styles[icon.s],
      keywords: icon.k,
      excalidrawPath: this.decompressPath(icon.e),
    };
  }

  private decompressPath(compressedPath: string): string {
    const colonIndex = compressedPath.indexOf(':');
    if (colonIndex === -1) {
      return compressedPath; // Not compressed
    }

    const prefixIndex = parseInt(compressedPath.substring(0, colonIndex));
    const suffix = compressedPath.substring(colonIndex + 1);

    if (prefixIndex >= 0 && prefixIndex < this.commonPaths.length) {
      return this.commonPaths[prefixIndex] + suffix;
    }

    return compressedPath; // Fallback
  }
}

// Legacy format for backward compatibility
export interface LegacyIcon {
  id: string;
  name: string;
  displayName: string;
  category: string;
  style: string;
  keywords: string[];
  excalidrawPath: string;
}

export interface DecompressedIcon extends LegacyIcon {}

// Emoji optimization types
export interface OptimizedEmojisData {
  meta: {
    totalCount: number;
    lastUpdated: string;
    version: string;
    compression: {
      categories: string[];
      styles: string[];
      skinTones: string[];
      commonPaths: string[];
    };
  };
  emojis: OptimizedEmoji[];
}

export interface OptimizedEmoji {
  i: string; // id
  n: string; // name
  d: string; // displayName
  c: number; // category (index into categories array)
  s: number; // style (index into styles array)
  t: number; // skinTone (index into skinTones array, -1 for null)
  k: string[]; // keywords (compressed)
  e: string; // excalidrawPath (compressed)
}

export interface EmojiSearchIndex {
  index: EmojiSearchEntry[];
}

export interface EmojiSearchEntry {
  i: string; // emoji id
  t: string; // searchable text
}

// Legacy emoji format for backward compatibility
export interface LegacyEmoji {
  id: string;
  name: string;
  displayName: string;
  category: string;
  style: string;
  skinTone: string | null;
  keywords: string[];
  excalidrawPath: string;
}

export interface DecompressedEmoji extends LegacyEmoji {}

// Enhanced data decompressor for both icons and emojis
export class EmojiDataDecompressor {
  private categories: string[];
  private styles: string[];
  private skinTones: string[];
  private commonPaths: string[];

  constructor(compressionData: OptimizedEmojisData['meta']['compression']) {
    this.categories = compressionData.categories;
    this.styles = compressionData.styles;
    this.skinTones = compressionData.skinTones;
    this.commonPaths = compressionData.commonPaths;
  }

  decompressEmoji(emoji: OptimizedEmoji): DecompressedEmoji {
    return {
      id: emoji.i,
      name: emoji.n,
      displayName: emoji.d,
      category: this.categories[emoji.c],
      style: this.styles[emoji.s],
      skinTone: emoji.t >= 0 ? this.skinTones[emoji.t] : null,
      keywords: emoji.k,
      excalidrawPath: this.decompressPath(emoji.e),
    };
  }

  private decompressPath(compressedPath: string): string {
    const colonIndex = compressedPath.indexOf(':');
    if (colonIndex === -1) {
      return compressedPath; // Not compressed
    }

    const prefixIndex = parseInt(compressedPath.substring(0, colonIndex));
    const suffix = compressedPath.substring(colonIndex + 1);

    if (prefixIndex >= 0 && prefixIndex < this.commonPaths.length) {
      return this.commonPaths[prefixIndex] + suffix;
    }

    return compressedPath; // Fallback
  }
}
