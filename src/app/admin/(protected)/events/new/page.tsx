'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CreateEventInput } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getQueryClient } from '@/components/providers';
import { ApiError } from '@/lib/http';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CATEGORIES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';

export default function NewEventPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    category: CATEGORIES[0] as string,
    city: '',
    startsAt: '',
    price: '',
    imageUrl: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageError, setImageError] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: CreateEventInput) => api.admin.events.create(data),
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: queryKeys.admin.events(1) });
      getQueryClient().invalidateQueries({ queryKey: queryKeys.events.list({}) });
      getQueryClient().invalidateQueries({ queryKey: queryKeys.events.filters() });
      toast.success('Event added');
      router.push('/admin');
      router.refresh();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.fields) {
        setErrors(err.fields);
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to create event');
      }
    },
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    if (field === 'imageUrl') setImageError(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};

    if (!formData.title.trim() || formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.trim().length > 80) {
      newErrors.title = 'Title must be at most 80 characters';
    }
    if (!formData.city.trim() || formData.city.trim().length < 2) {
      newErrors.city = 'City must be at least 2 characters';
    }
    if (!formData.startsAt) {
      newErrors.startsAt = 'Date and time is required';
    } else if (isNaN(new Date(formData.startsAt).getTime())) {
      newErrors.startsAt = 'Invalid date';
    }
    const price = parseInt(formData.price, 10);
    if (isNaN(price) || price < 0 || price > 1000000) {
      newErrors.price = 'Price must be between 0 and 10,00,000';
    }
    if (!formData.imageUrl.trim()) {
      newErrors.imageUrl = 'Image URL is required';
    } else {
      try {
        new URL(formData.imageUrl);
        if (!formData.imageUrl.startsWith('http://') && !formData.imageUrl.startsWith('https://')) {
          newErrors.imageUrl = 'Must be a valid http(s) URL';
        }
      } catch {
        newErrors.imageUrl = 'Must be a valid URL';
      }
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.trim().length > 1000) {
      newErrors.description = 'Description must be at most 1000 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate({
      ...formData,
      startsAt: new Date(formData.startsAt).toISOString(),
      price,
    });
  };

  const inputClass = (field: string) =>
    cn(
      'w-full h-11 px-4 rounded-lg border bg-surface text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition',
      errors[field] ? 'border-danger' : 'border-line'
    );

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6" noValidate>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-brand-soft transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">Add event</h1>
      </div>

      <div className="space-y-5">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-ink mb-1.5">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            maxLength={80}
            className={inputClass('title')}
            placeholder="Sunday Unplugged Music Night"
          />
          {errors.title && <p className="mt-1.5 text-sm text-danger">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-ink mb-1.5">
              Category
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className={cn(inputClass('category'), 'appearance-none')}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-ink mb-1.5">
              City
            </label>
            <input
              id="city"
              type="text"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              maxLength={50}
              className={inputClass('city')}
              placeholder="Coimbatore"
            />
            {errors.city && <p className="mt-1.5 text-sm text-danger">{errors.city}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="startsAt" className="block text-sm font-medium text-ink mb-1.5">
              Date and time (IST)
            </label>
            <input
              id="startsAt"
              type="datetime-local"
              value={formData.startsAt}
              onChange={(e) => handleChange('startsAt', e.target.value)}
              className={inputClass('startsAt')}
            />
            {errors.startsAt && <p className="mt-1.5 text-sm text-danger">{errors.startsAt}</p>}
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-ink mb-1.5">
              Price (₹) — 0 for a free event
            </label>
            <input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              min={0}
              max={1000000}
              step={1}
              className={inputClass('price')}
              placeholder="499"
            />
            {errors.price && <p className="mt-1.5 text-sm text-danger">{errors.price}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-ink mb-1.5">
            Image URL
          </label>
          <input
            id="imageUrl"
            type="url"
            value={formData.imageUrl}
            onChange={(e) => handleChange('imageUrl', e.target.value)}
            maxLength={500}
            className={cn(inputClass('imageUrl'), (errors.imageUrl || imageError) && 'border-danger')}
            placeholder="https://example.com/image.jpg"
          />
          {(errors.imageUrl || imageError) && (
            <p className="mt-1.5 text-sm text-danger">{errors.imageUrl || 'That image could not be loaded'}</p>
          )}

          {formData.imageUrl && !imageError && (
            <div className="mt-3 relative aspect-[16/9] max-w-xs rounded-lg overflow-hidden bg-line border border-line">
              <img
                src={formData.imageUrl}
                alt="Image preview"
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
                onLoad={() => setImageError(false)}
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-ink mb-1.5">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={5}
            maxLength={1000}
            className={cn(
              'w-full px-4 py-3 rounded-lg border bg-surface text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition resize-y',
              errors.description ? 'border-danger' : 'border-line'
            )}
            placeholder="Describe your event…"
          />
          {errors.description && <p className="mt-1.5 text-sm text-danger">{errors.description}</p>}
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-line">
        <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" size="lg" className="flex-1" isLoading={mutation.isPending}>
          {!mutation.isPending && <Plus className="w-4 h-4" />}
          {mutation.isPending ? 'Creating…' : 'Create event'}
        </Button>
      </div>
    </form>
  );
}
