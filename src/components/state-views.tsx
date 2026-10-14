'use client';

import { memo } from 'react';
import { Search, Calendar, Heart, Star } from 'lucide-react';
import { Button } from './ui/button';
import { EmptyState } from './ui/empty-state';
import { ErrorState } from './ui/error-state';
import { LoadingSkeleton } from './ui/skeleton';

// Re-export the primitives so existing imports keep working.
export { EmptyState, ErrorState, LoadingSkeleton };

/** Events board: filtered vs. genuinely empty. */
export const EventEmptyState = memo(function EventEmptyState({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean;
  onClearFilters?: () => void;
}) {
  if (hasFilters) {
    return (
      <EmptyState
        icon={<Search className="w-8 h-8" />}
        title="No events match your filters"
        description="Try adjusting your search or filters to find events."
        action={
          onClearFilters && (
            <Button onClick={onClearFilters}>
              <Search className="w-4 h-4" />
              Clear filters
            </Button>
          )
        }
      />
    );
  }

  return (
    <EmptyState
      icon={<Calendar className="w-8 h-8" />}
      title="No upcoming events yet"
      description="Check back soon for new events in your area."
    />
  );
});

/** My Feed empty states. */
export const FeedEmptyState = memo(function FeedEmptyState({
  hasFavourites,
  onChooseCategories,
}: {
  hasFavourites: boolean;
  onChooseCategories: () => void;
}) {
  if (!hasFavourites) {
    return (
      <EmptyState
        icon={<Heart className="w-8 h-8" />}
        title="Pick your favourite categories to see events here"
        description="Choose the categories you care about and we'll build your feed."
        action={
          <Button onClick={onChooseCategories}>
            <Heart className="w-4 h-4" />
            Choose categories
          </Button>
        }
      />
    );
  }

  return (
    <EmptyState
      icon={<Star className="w-8 h-8" />}
      title="No upcoming events in your categories yet"
      description="Check back soon."
      action={
        <Button variant="secondary" onClick={onChooseCategories}>
          Edit favourites
        </Button>
      }
    />
  );
});
