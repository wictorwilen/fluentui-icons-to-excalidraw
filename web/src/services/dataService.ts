import {
  OptimizedIconsData,
  OptimizedEmojisData,
  SearchIndex,
  EmojiSearchIndex,
  CategoriesData,
  DataDecompressor,
  EmojiDataDecompressor,
  DecompressedIcon,
  DecompressedEmoji,
  LegacyIcon,
  LegacyEmoji,
} from '../types/optimized-data';

/**
 * Service for loading and handling optimized icon and emoji data
 * Supports both legacy and optimized formats for smooth migration
 */
export class DataService {
  private iconsData: OptimizedIconsData | null = null;
  private emojisData: OptimizedEmojisData | null = null;
  private searchIndex: SearchIndex | null = null;
  private emojiSearchIndex: EmojiSearchIndex | null = null;
  private categoriesData: CategoriesData | null = null;
  private iconDecompressor: DataDecompressor | null = null;
  private emojiDecompressor: EmojiDataDecompressor | null = null;
  private isIconsOptimized = false;
  private isEmojisOptimized = false;

  /**
   * Load icon data - automatically detects format
   */
  async loadIconsData(): Promise<DecompressedIcon[]> {
    try {
      const response = await fetch('/data/icons.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Check if this is optimized format (has meta.compression)
      if (data.meta && data.meta.compression) {
        const optimizedData: OptimizedIconsData = data;
        this.iconsData = optimizedData;
        this.isIconsOptimized = true;
        this.iconDecompressor = new DataDecompressor(optimizedData.meta.compression);
        // eslint-disable-next-line no-console
        console.log('📦 Loaded optimized icons data');
        return this.getDecompressedIcons();
      }

      // Legacy format (has icons array directly)
      if (data.icons && Array.isArray(data.icons)) {
        const legacyData: { icons: LegacyIcon[] } = data;
        // eslint-disable-next-line no-console
        console.log('📋 Loaded legacy icons data');
        return legacyData.icons;
      }

      throw new Error('Invalid icons data format - expected either optimized or legacy format');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Failed to load icons data:', error);
      throw error;
    }
  }

  /**
   * Load search index (optimized format only)
   */
  async loadSearchIndex(): Promise<SearchIndex | null> {
    if (!this.isIconsOptimized) {
      return null; // Search index not available in legacy format
    }

    try {
      const response = await fetch('/data/search-index.json');
      if (response.ok) {
        this.searchIndex = await response.json();
        // eslint-disable-next-line no-console
        console.log('🔍 Loaded search index');
        return this.searchIndex;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ Failed to load search index:', error);
    }

    return null;
  }

  /**
   * Load categories data
   */
  async loadCategories(): Promise<CategoriesData | null> {
    try {
      const response = await fetch('/data/categories.json');
      if (response.ok) {
        this.categoriesData = await response.json();
        // eslint-disable-next-line no-console
        console.log('🏷️ Loaded categories data');
        return this.categoriesData;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ Failed to load categories data:', error);
    }

    return null;
  }

  /**
   * Get decompressed icons (for optimized format)
   */
  private getDecompressedIcons(): DecompressedIcon[] {
    if (!this.iconsData || !this.iconDecompressor) {
      return [];
    }

    return this.iconsData.icons.map(icon => this.iconDecompressor!.decompressIcon(icon));
  }

  /**
   * Search icons using the optimized search index
   */
  searchIcons(query: string, icons: DecompressedIcon[]): DecompressedIcon[] {
    if (!query.trim()) {
      return icons;
    }

    const normalizedQuery = query.toLowerCase().trim();

    // Use search index if available (much faster)
    if (this.searchIndex && this.isIconsOptimized) {
      const matchingIds = new Set(
        this.searchIndex.index
          .filter(entry => entry.t.includes(normalizedQuery))
          .map(entry => entry.i)
      );

      return icons.filter(icon => matchingIds.has(icon.id));
    }

    // Fallback to direct search (legacy format)
    return icons.filter(icon => {
      const searchText =
        `${icon.name} ${icon.displayName} ${icon.keywords.join(' ')}`.toLowerCase();
      return searchText.includes(normalizedQuery);
    });
  }

  /**
   * Get available categories
   */
  getCategories(): string[] {
    if (this.categoriesData) {
      return this.categoriesData.categories.map(cat => cat.name);
    }

    // Fallback: extract from icon data
    if (this.iconsData && this.iconDecompressor) {
      return this.iconsData.meta.compression.categories;
    }

    return [];
  }

  /**
   * Get file size savings info
   */
  getOptimizationInfo(): { isOptimized: boolean; format: string } {
    return {
      isOptimized: this.isIconsOptimized,
      format: this.isIconsOptimized ? 'optimized-v2' : 'legacy-v1',
    };
  }

  /**
   * Load emoji data - automatically detects format
   */
  async loadEmojisData(): Promise<DecompressedEmoji[]> {
    try {
      const response = await fetch('/data/emojis.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Check if this is optimized format (has meta.compression)
      if (data.meta && data.meta.compression) {
        const optimizedData: OptimizedEmojisData = data;
        this.emojisData = optimizedData;
        this.isEmojisOptimized = true;
        this.emojiDecompressor = new EmojiDataDecompressor(optimizedData.meta.compression);
        // eslint-disable-next-line no-console
        console.log('📦 Loaded optimized emojis data');
        return this.getDecompressedEmojis();
      }

      // Legacy format (has emojis array directly)
      if (data.emojis && Array.isArray(data.emojis)) {
        const legacyData: { emojis: LegacyEmoji[] } = data;
        // eslint-disable-next-line no-console
        console.log('📋 Loaded legacy emojis data');
        return legacyData.emojis;
      }

      throw new Error('Invalid emojis data format - expected either optimized or legacy format');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Failed to load emojis data:', error);
      throw error;
    }
  }

  /**
   * Load emoji search index (optimized format only)
   */
  async loadEmojiSearchIndex(): Promise<EmojiSearchIndex | null> {
    if (!this.isEmojisOptimized) {
      return null; // Search index not available in legacy format
    }

    try {
      const response = await fetch('/data/emoji-search-index.json');
      if (response.ok) {
        this.emojiSearchIndex = await response.json();
        // eslint-disable-next-line no-console
        console.log('🔍 Loaded emoji search index');
        return this.emojiSearchIndex;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ Failed to load emoji search index:', error);
    }

    return null;
  }

  /**
   * Get decompressed emojis (for optimized format)
   */
  private getDecompressedEmojis(): DecompressedEmoji[] {
    if (!this.emojisData || !this.emojiDecompressor) {
      return [];
    }

    return this.emojisData.emojis.map(emoji => this.emojiDecompressor!.decompressEmoji(emoji));
  }

  /**
   * Search emojis using the optimized search index
   */
  searchEmojis(query: string, emojis: DecompressedEmoji[]): DecompressedEmoji[] {
    if (!query.trim()) {
      return emojis;
    }

    const normalizedQuery = query.toLowerCase().trim();

    // Use search index if available (much faster)
    if (this.emojiSearchIndex && this.isEmojisOptimized) {
      const matchingIds = new Set(
        this.emojiSearchIndex.index
          .filter(entry => entry.t.includes(normalizedQuery))
          .map(entry => entry.i)
      );

      return emojis.filter(emoji => matchingIds.has(emoji.id));
    }

    // Fallback to direct search (legacy format)
    return emojis.filter(emoji => {
      const searchText =
        `${emoji.name} ${emoji.displayName} ${emoji.keywords.join(' ')}`.toLowerCase();
      return searchText.includes(normalizedQuery);
    });
  }
}

// Singleton instance
export const dataService = new DataService();
