'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getQueryClient } from '@/components/providers';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Mail, Lock, AlertCircle, UserPlus, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

  const mutation = useMutation({
    mutationFn: (data: { email: string; password: string }) => api.auth.signup(data),
    onSuccess: (data) => {
      getQueryClient().setQueryData(queryKeys.me(), { user: data.user });
      // Straight to the favourite categories step after signup.
      router.push('/favourites');
      router.refresh();
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Signup failed. Please try again.';
      setFormError(message);
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const errors: typeof fieldErrors = {};
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = 'Enter a valid email address';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    mutation.mutate({ email, password });
  };

  return (
    <div className="max-w-sm mx-auto">
      <div className="bg-surface border border-line rounded-2xl shadow-soft p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-brand-gradient text-white flex items-center justify-center">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Create your account</h1>
          <p className="text-muted mt-1 text-sm">Join and start saving events you love</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {formError && (
            <div className="flex items-center gap-2 px-4 py-3 bg-danger/5 border border-danger/20 rounded-lg text-sm text-danger" role="alert">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                aria-invalid={!!fieldErrors.email}
                className="w-full h-11 pl-11 pr-4 rounded-lg border border-line bg-surface text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition"
                placeholder="you@example.com"
              />
            </div>
            {fieldErrors.email && <p className="mt-1.5 text-sm text-danger">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                aria-invalid={!!fieldErrors.password}
                className="w-full h-11 pl-11 pr-11 rounded-lg border border-line bg-surface text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition"
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-muted hover:text-ink hover:bg-brand-soft transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && <p className="mt-1.5 text-sm text-danger">{fieldErrors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink mb-1.5">
              Confirm password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                aria-invalid={!!fieldErrors.confirmPassword}
                className="w-full h-11 pl-11 pr-4 rounded-lg border border-line bg-surface text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition"
                placeholder="••••••••"
              />
            </div>
            {fieldErrors.confirmPassword && <p className="mt-1.5 text-sm text-danger">{fieldErrors.confirmPassword}</p>}
          </div>

          <Button type="submit" fullWidth size="lg" isLoading={mutation.isPending}>
            {mutation.isPending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-brand font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
