import React from 'react';
import { Icon, Emoji } from '../../types';
import { useFavorites } from '../../hooks/useFavorites';
import { StarIcon, StarIconFilled } from './MinimalIcons';
import { trackFavoriteToggle } from '../../services/analytics';

interface FavoriteButtonProps {
  item: Icon | Emoji;
  itemType: 'icon' | 'emoji';
  className?: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ item, itemType, className = '' }) => {
  const { isFavorite, toggleFavorite } = useFavorites();

  const isItemFavorite = isFavorite(item.id);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const action = isItemFavorite ? 'remove' : 'add';
    const itemName = item.name || item.id;
    
    // Track the favorite toggle event
    trackFavoriteToggle(itemType, itemName, action);
    
    toggleFavorite(item, itemType);
  };

  const baseClasses = `
    inline-flex items-center justify-center 
    w-8 h-8 rounded-full 
    transition-all duration-200 
    hover:bg-gray-100 dark:hover:bg-gray-700
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    ${className}
  `;

  const iconClasses = isItemFavorite
    ? 'w-5 h-5 text-yellow-500 hover:text-yellow-600'
    : 'w-5 h-5 text-gray-400 hover:text-yellow-500';

  return (
    <button
      onClick={handleToggleFavorite}
      className={baseClasses}
      title={isItemFavorite ? 'Remove from favorites' : 'Add to favorites'}
      aria-label={isItemFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isItemFavorite ? (
        <StarIconFilled className={iconClasses} />
      ) : (
        <StarIcon className={iconClasses} />
      )}
    </button>
  );
};

export default FavoriteButton;
