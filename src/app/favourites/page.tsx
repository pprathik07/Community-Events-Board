'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { CATEGORIES } from '@/lib/constants';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const CATEGORY_EMOJI: Record<string, string> = {
  Music: '🎵',
  Workshop: '🛠️',
  Food: '🍕',
  Sports: '⚽',
  Kids: '🧸',
};

export default function FavouritesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const initialised = useRef(false);

  const { data: favourites, isLoading } = useQuery({
    queryKey: queryKeys.favourites(),
    queryFn: () => api.me.favourites.get(),
  });

  // Prefill once the saved favourites arrive.
  useEffect(() => {
    if (favourites && !initialised.current) {
      setSelected(favourites.categories ?? []);
      initialised.current = true;
    }
  }, [favourites]);

  const mutation = useMutation({
    mutationFn: (categories: string[]) => api.me.favourites.set(categories),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.favourites(), { categories: data.categories });
      toast.success('Favourites saved');
      router.push('/feed');
      router.refresh();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to save favourites. Please try again.');
    },
  });

  const handleToggle = useCallback((category: string) => {
    setSelected((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  }, []);

  const title = <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">What are you into?</h1>;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {title}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => (
            <div key={cat} className="h-16 rounded-2xl skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        {title}
        <p className="text-muted">Pick your favourite categories to personalise your feed</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="group" aria-label="Favourite categories">
        {CATEGORIES.map((category) => {
          const isSelected = selected.includes(category);
          return (
            <button
              key={category}
              type="button"
              onClick={() => handleToggle(category)}
              aria-pressed={isSelected}
              className={cn(
                'relative flex items-center gap-3 h-16 px-5 rounded-2xl border-2 text-left transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                isSelected
                  ? 'border-brand bg-brand-soft'
                  : 'border-line bg-surface hover:border-brand/50 hover:bg-brand-soft/50'
              )}
            >
              <span className="text-2xl" role="img" aria-hidden>
                {CATEGORY_EMOJI[category]}
              </span>
              <span className="font-semibold text-ink">{category}</span>
              {isSelected && (
                <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Button
        onClick={() => mutation.mutate(selected)}
        disabled={selected.length === 0}
        isLoading={mutation.isPending}
        fullWidth
        size="lg"
      >
        {mutation.isPending ? 'Saving…' : 'Save'}
      </Button>
    </div>
  );
}
