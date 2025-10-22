import { useState, useEffect } from 'react';
import { Icon, Emoji } from '../types';
import favoritesService from '../services/favoritesService';

interface UseFavoritesReturn {
  isFavorite: (itemId: string) => boolean;
  toggleFavorite: (item: Icon | Emoji, itemType: 'icon' | 'emoji') => void;
  // Legacy methods for backward compatibility
  isIconFavorite: (iconId: string) => boolean;
  isEmojiFavorite: (emojiId: string) => boolean;
  toggleIconFavorite: (iconId: string) => void;
  toggleEmojiFavorite: (emojiId: string) => void;
  getFavoriteIcons: (allIcons: Icon[]) => Icon[];
  getFavoriteEmojis: (allEmojis: Emoji[]) => Emoji[];
  favoritesCount: { icons: number; emojis: number; total: number };
  clearAllFavorites: () => void;
}

export const useFavorites = (): UseFavoritesReturn => {
  const [, setUpdateTrigger] = useState(0);

  useEffect(() => {
    // Subscribe to favorites changes
    const unsubscribe = favoritesService.addListener(() => {
      setUpdateTrigger(prev => prev + 1);
    });

    return unsubscribe;
  }, []);

  return {
    // New simplified API
    isFavorite: (itemId: string) => favoritesService.isFavorite(itemId),
    toggleFavorite: (item: Icon | Emoji, itemType: 'icon' | 'emoji') =>
      favoritesService.toggleFavorite(item, itemType),

    // Legacy methods for backward compatibility
    isIconFavorite: (iconId: string) => favoritesService.isIconFavorite(iconId),
    isEmojiFavorite: (emojiId: string) => favoritesService.isEmojiFavorite(emojiId),
    toggleIconFavorite: (iconId: string) => favoritesService.toggleIconFavorite(iconId),
    toggleEmojiFavorite: (emojiId: string) => favoritesService.toggleEmojiFavorite(emojiId),
    getFavoriteIcons: (allIcons: Icon[]) => favoritesService.getFavoriteIcons(allIcons),
    getFavoriteEmojis: (allEmojis: Emoji[]) => favoritesService.getFavoriteEmojis(allEmojis),
    favoritesCount: favoritesService.getFavoritesCount(),
    clearAllFavorites: () => favoritesService.clearAllFavorites(),
  };
};
