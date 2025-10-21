import Fuse from 'fuse.js';
import { Icon, Emoji, Category, SearchFilters, SearchResult } from '../types';

// Raw data types from JSON files
interface RawIconData {
  id?: string;
  name?: string;
  displayName?: string;
  category?: string;
  style?: string;
  keywords?: string[];
  excalidrawPath?: string;
  path: string;
}

interface RawEmojiData {
  id?: string;
  name?: string;
  displayName?: string;
  category?: string;
  style?: string;
  keywords?: string[];
  excalidrawPath?: string;
  skinTone?: string;
  unicode?: string;
  codepoint?: string;
}

class DataService {
  private icons: Icon[] = [];
  private emojis: Emoji[] = [];
  private categories: Category[] = [];
  private iconSearchIndex: Fuse<Icon> | null = null;
  private emojiSearchIndex: Fuse<Emoji> | null = null;
  private loaded = false;

  // Initialize search indices
  private initializeSearchIndices() {
    const iconSearchOptions = {
      keys: [
        { name: 'displayName', weight: 0.4 },
        { name: 'name', weight: 0.3 },
        { name: 'keywords', weight: 0.2 },
        { name: 'category', weight: 0.1 },
      ],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 2,
    };

    const emojiSearchOptions = {
      keys: [
        { name: 'displayName', weight: 0.4 },
        { name: 'name', weight: 0.3 },
        { name: 'keywords', weight: 0.2 },
        { name: 'category', weight: 0.1 },
      ],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 2,
    };

    this.iconSearchIndex = new Fuse(this.icons, iconSearchOptions);
    this.emojiSearchIndex = new Fuse(this.emojis, emojiSearchOptions);
  }

  // Load icon and emoji data
  async loadData(): Promise<void> {
    if (this.loaded) return;

    try {
      // Load real data from static JSON files
      const [iconsResponse, emojisResponse, categoriesResponse] = await Promise.all([
        fetch('/data/icons.json'),
        fetch('/data/emojis.json'),
        fetch('/data/categories.json'),
      ]);

      if (!iconsResponse.ok || !emojisResponse.ok || !categoriesResponse.ok) {
        throw new Error('Failed to fetch data files');
      }

      const [iconsData, emojisData, categoriesData] = await Promise.all([
        iconsResponse.json(),
        emojisResponse.json(),
        categoriesResponse.json(),
      ]);

      // Process categories
      this.categories = categoriesData.categories || [];

      // Process icons
      this.icons = (iconsData.icons || []).map((icon: RawIconData) => ({
        id: icon.id || this.extractIconId(icon.path),
        name: icon.name || this.extractIconName(icon.path),
        displayName:
          icon.displayName || this.formatDisplayName(icon.name || this.extractIconName(icon.path)),
        category: icon.category || 'other',
        style: icon.style || this.extractIconStyle(icon.path),
        keywords: icon.keywords || [],
        excalidrawPath:
          icon.excalidrawPath ||
          `/excalidraw/icons/${icon.id || this.extractIconId(icon.path)}.excalidraw`,
        svgPath: icon.path,
      }));

      // Process emojis
      this.emojis = (emojisData.emojis || []).map((emoji: RawEmojiData) => ({
        id: emoji.id || emoji.name,
        name: emoji.name || '',
        displayName: emoji.displayName || this.formatDisplayName(emoji.name || ''),
        category: emoji.category || 'other',
        style: emoji.style || 'flat',
        keywords: emoji.keywords || [],
        excalidrawPath:
          emoji.excalidrawPath || `/excalidraw/emojis/${emoji.id || emoji.name}.excalidraw`,
        unicode: emoji.unicode || '',
        codepoint: emoji.codepoint || '',
      }));

      this.initializeSearchIndices();
      this.loaded = true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load data:', error);
      throw new Error('Failed to load icon and emoji data');
    }
  }

  // Get all categories
  getCategories(): Category[] {
    return this.categories;
  }

  // Get all icons
  getIcons(): Icon[] {
    return this.icons;
  }

  // Get all emojis
  getEmojis(): Emoji[] {
    return this.emojis;
  }

  // Search icons and emojis based on filters
  search(filters: SearchFilters, limit: number = 50, offset: number = 0): SearchResult {
    let filteredIcons: Icon[] = [];
    let filteredEmojis: Emoji[] = [];

    // Apply text search
    if (filters.query && filters.query.length >= 2) {
      // Search icons
      if (filters.type === 'all' || filters.type === 'icons') {
        const iconResults = this.iconSearchIndex?.search(filters.query) || [];
        filteredIcons = iconResults.map(result => result.item);
      }

      // Search emojis
      if (filters.type === 'all' || filters.type === 'emojis') {
        const emojiResults = this.emojiSearchIndex?.search(filters.query) || [];
        filteredEmojis = emojiResults.map(result => result.item);
      }
    } else {
      // No search query - use all items
      if (filters.type === 'all' || filters.type === 'icons') {
        filteredIcons = this.icons;
      }
      if (filters.type === 'all' || filters.type === 'emojis') {
        filteredEmojis = this.emojis;
      }
    }

    // Apply category filter
    if (filters.category) {
      filteredIcons = filteredIcons.filter(icon => icon.category === filters.category);
      filteredEmojis = filteredEmojis.filter(emoji => emoji.category === filters.category);
    }

    // Apply style filter (icons only)
    if (filters.styles.length > 0) {
      filteredIcons = filteredIcons.filter(icon => filters.styles.includes(icon.style));
    }

    // Sort results
    filteredIcons.sort((a, b) => a.displayName.localeCompare(b.displayName));
    filteredEmojis.sort((a, b) => a.displayName.localeCompare(b.displayName));

    // Apply pagination
    const allResults = [...filteredIcons, ...filteredEmojis];
    const totalCount = allResults.length;
    const paginatedResults = allResults.slice(offset, offset + limit);

    // Separate paginated results back into icons and emojis
    const paginatedIcons = paginatedResults.filter(item => 'style' in item) as Icon[];
    const paginatedEmojis = paginatedResults.filter(item => !('style' in item)) as Emoji[];

    return {
      icons: paginatedIcons,
      emojis: paginatedEmojis,
      totalCount,
      hasMore: offset + limit < totalCount,
    };
  }

  // Get icons by category
  getIconsByCategory(categoryId: string): Icon[] {
    return this.icons.filter(icon => icon.category === categoryId);
  }

  // Get emojis by category
  getEmojisByCategory(categoryId: string): Emoji[] {
    return this.emojis.filter(emoji => emoji.category === categoryId);
  }

  // Get popular/featured items
  getFeaturedIcons(limit: number = 20): Icon[] {
    // For now, just return the first N icons
    // In a real implementation, this could be based on usage statistics
    return this.icons.slice(0, limit);
  }

  getFeaturedEmojis(limit: number = 20): Emoji[] {
    return this.emojis.slice(0, limit);
  }

  // Helper methods for processing metadata
  private extractIconName(filePath: string): string {
    const parts = filePath.split('/');
    const filename = parts[parts.length - 1];
    const match = filename.match(/ic_fluent_(.+?)_\d+_(filled|regular|light)\.svg/);
    return match ? match[1].replace(/_/g, '-') : filename.replace('.svg', '');
  }

  private extractIconId(filePath: string): string {
    const name = this.extractIconName(filePath);
    const size = this.extractIconSize(filePath);
    const style = this.extractIconStyle(filePath);
    return `${name}-${size}-${style}`;
  }

  private extractIconStyle(filePath: string): 'regular' | 'filled' | 'light' {
    const filename = filePath.split('/').pop() || '';
    if (filename.includes('_filled.svg')) return 'filled';
    if (filename.includes('_light.svg')) return 'light';
    return 'regular';
  }

  private extractIconSize(filePath: string): number {
    const filename = filePath.split('/').pop() || '';
    const match = filename.match(/_(\d+)_/);
    return match ? parseInt(match[1], 10) : 24;
  }

  private formatDisplayName(name: string): string {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

// Export singleton instance
export const dataService = new DataService();
export default dataService;
