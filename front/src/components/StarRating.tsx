import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  initialRating: number;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ 
  initialRating, 
  onRatingChange, 
  size = 'sm',
  readonly = false 
}) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleClick = (star: number) => {
    if (readonly) return;
    setRating(star);
    onRatingChange?.(star);
  };

  const handleMouseEnter = (star: number) => {
    if (readonly) return;
    setHoverRating(star);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    setHoverRating(0);
  };

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverRating || rating);
        return (
          <Star
            key={star}
            className={`${sizeClasses[size]} transition-all duration-150 ${
              readonly 
                ? 'cursor-default' 
                : 'cursor-pointer hover:scale-110'
            } ${
              isFilled 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-muted-foreground hover:text-yellow-400'
            }`}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
          />
        );
      })}
      <span className="text-sm text-muted-foreground ml-2">
        ({rating}/5)
      </span>
    </div>
  );
};

export default StarRating;