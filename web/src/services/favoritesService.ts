import { Icon, Emoji } from '../types';

const FAVORITES_STORAGE_KEY = 'fluent-jot-favorites';

interface FavoriteItem {
  id: string;
  type: 'icon' | 'emoji';
}

interface StoredFavorites {
  items: FavoriteItem[];
  version: string;
}

interface FavoritesState {
  items: Map<string, 'icon' | 'emoji'>;
}

class FavoritesService {
  private static instance: FavoritesService;
  private favorites: FavoritesState = { items: new Map() };
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): FavoritesService {
    if (!FavoritesService.instance) {
      FavoritesService.instance = new FavoritesService();
    }
    return FavoritesService.instance;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed: StoredFavorites = JSON.parse(stored);
        
        // Handle new format
        if (parsed.items && Array.isArray(parsed.items)) {
          this.favorites.items = new Map(
            parsed.items.map(item => [item.id, item.type])
          );
          return;
        }
        
        // Handle legacy format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const legacy = parsed as any;
        if (legacy.icons || legacy.emojis) {
          this.favorites.items = new Map();
          // Migrate legacy icons
          if (legacy.icons && Array.isArray(legacy.icons)) {
            legacy.icons.forEach((id: string) => {
              this.favorites.items.set(id, 'icon');
            });
          }
          // Skip legacy emojis as they had wrong IDs
          this.saveToStorage(); // Save migrated data
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load favorites from storage:', error);
      this.favorites.items = new Map();
    }
  }

  private saveToStorage(): void {
    try {
      const toStore: StoredFavorites = {
        items: Array.from(this.favorites.items.entries()).map(([id, type]) => ({
          id,
          type
        })),
        version: '2.0'
      };
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to save favorites to storage:', error);
    }
  }

  public addListener(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  public toggleFavorite(item: Icon | Emoji, itemType: 'icon' | 'emoji'): void {
    if (this.favorites.items.has(item.id)) {
      this.favorites.items.delete(item.id);
    } else {
      this.favorites.items.set(item.id, itemType);
    }
    
    this.saveToStorage();
    this.notifyListeners();
  }
  
  public isFavorite(itemId: string): boolean {
    return this.favorites.items.has(itemId);
  }

  public isIconFavorite(iconId: string): boolean {
    return this.favorites.items.get(iconId) === 'icon';
  }

  public isEmojiFavorite(emojiId: string): boolean {
    return this.favorites.items.get(emojiId) === 'emoji';
  }

  // Legacy methods for backward compatibility
  public toggleIconFavorite(iconId: string): void {
    if (this.favorites.items.get(iconId) === 'icon') {
      this.favorites.items.delete(iconId);
    } else {
      this.favorites.items.set(iconId, 'icon');
    }
    this.saveToStorage();
    this.notifyListeners();
  }

  public toggleEmojiFavorite(emojiId: string): void {
    if (this.favorites.items.get(emojiId) === 'emoji') {
      this.favorites.items.delete(emojiId);
    } else {
      this.favorites.items.set(emojiId, 'emoji');
    }
    this.saveToStorage();
    this.notifyListeners();
  }

  public getFavoriteIcons(allIcons: Icon[]): Icon[] {
    return allIcons.filter(icon => this.favorites.items.get(icon.id) === 'icon');
  }

  public getFavoriteEmojis(allEmojis: Emoji[]): Emoji[] {
    return allEmojis.filter(emoji => this.favorites.items.get(emoji.id) === 'emoji');
  }

  public getFavoritesCount(): { icons: number; emojis: number; total: number } {
    let icons = 0;
    let emojis = 0;
    
    this.favorites.items.forEach((type) => {
      if (type === 'icon') icons++;
      else if (type === 'emoji') emojis++;
    });
    
    return {
      icons,
      emojis,
      total: icons + emojis
    };
  }

  public clearAllFavorites(): void {
    this.favorites.items.clear();
    this.saveToStorage();
    this.notifyListeners();
  }

  private isIconItem(item: Icon | Emoji): boolean {
    // Icons have styles: regular, filled, light
    // Emojis have styles: flat, color
    return 'style' in item && ['regular', 'filled', 'light'].includes(item.style as string);
  }
}

// Create and export a singleton instance
const favoritesService = FavoritesService.getInstance();
export default favoritesService;