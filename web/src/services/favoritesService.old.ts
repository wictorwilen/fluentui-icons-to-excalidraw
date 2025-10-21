import { Icon, Emoji, FavoritesState } from '../types';

const FAVORITES_STORAGE_KEY = 'fluent-jot-favorites';

interface StoredFavorites {
  icons: string[];
  emojis: string[];
  version: string;
}

class FavoritesService {
  private static instance: FavoritesService;
  private favorites: FavoritesState = { icons: new Set(), emojis: new Set() };
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

  private loadFromStorage(): FavoritesState {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed: StoredFavorites = JSON.parse(stored);
        return {
          icons: new Set(parsed.icons || []),
          emojis: new Set(parsed.emojis || [])
        };
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load favorites from localStorage:', error);
    }
    
    return {
      icons: new Set(),
      emojis: new Set()
    };
  }

  private saveToStorage(): void {
    try {
      const toStore: StoredFavorites = {
        icons: Array.from(this.favorites.icons),
        emojis: Array.from(this.favorites.emojis),
        version: '1.0'
      };
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(toStore));
      this.notifyListeners();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save favorites to localStorage:', error);
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

  public toggleIconFavorite(iconId: string): void {
    if (this.favorites.icons.has(iconId)) {
      this.favorites.icons.delete(iconId);
    } else {
      this.favorites.icons.add(iconId);
    }
    this.saveToStorage();
    this.notifyListeners();
  }

  public toggleEmojiFavorite(emojiId: string): void {
    if (this.favorites.emojis.has(emojiId)) {
      this.favorites.emojis.delete(emojiId);
    } else {
      this.favorites.emojis.add(emojiId);
    }
    this.saveToStorage();
    this.notifyListeners();
  }

  public isIconFavorite(iconId: string): boolean {
    return this.favorites.icons.has(iconId);
  }

  public isEmojiFavorite(emojiId: string): boolean {
    return this.favorites.emojis.has(emojiId);
  }

  public getFavoriteIcons(allIcons: Icon[]): Icon[] {
    return allIcons.filter(icon => this.favorites.icons.has(icon.id));
  }

  public getFavoriteEmojis(allEmojis: Emoji[]): Emoji[] {
    return allEmojis.filter(emoji => this.favorites.emojis.has(emoji.id));
  }

  public getFavoritesCount(): { icons: number; emojis: number; total: number } {
    return {
      icons: this.favorites.icons.size,
      emojis: this.favorites.emojis.size,
      total: this.favorites.icons.size + this.favorites.emojis.size
    };
  }

  public clearAllFavorites(): void {
    this.favorites.icons.clear();
    this.favorites.emojis.clear();
    this.saveToStorage();
  }

  /**
   * Clear corrupted emoji favorites that have invalid IDs
   * This is a one-time migration for existing users
   */
  public clearCorruptedEmojisFavorites(): void {
    // The corrupted emoji IDs follow a pattern like 'people-add-32-color'
    // Real emoji IDs are like '1st-place-medal', 'smiling-face', etc.
    const corruptedPattern = /-\d+-(color|flat)$/;
    
    const corruptedEmojis = Array.from(this.favorites.emojis).filter(id => 
      corruptedPattern.test(id)
    );
    
    if (corruptedEmojis.length > 0) {
      // eslint-disable-next-line no-console
      console.log('🧹 Clearing', corruptedEmojis.length, 'corrupted emoji favorites');
      corruptedEmojis.forEach(id => this.favorites.emojis.delete(id));
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  public exportFavorites(): StoredFavorites {
    return {
      icons: Array.from(this.favorites.icons),
      emojis: Array.from(this.favorites.emojis),
      version: '1.0'
    };
  }

  public importFavorites(data: StoredFavorites): void {
    this.favorites = {
      icons: new Set(data.icons || []),
      emojis: new Set(data.emojis || [])
    };
    this.saveToStorage();
  }
}

export default FavoritesService;