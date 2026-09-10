'use client';

/**
 * @file admin/src/app/login/page.tsx
 * @description [VIEW] Admin Login Screen with role verification, credentials helper, and session controls.
 */

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginAdmin } from '@/controllers/auth.controller';
import { Shield, Lock, Mail, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await loginAdmin(email, password);
      if (res.success) {
        router.push(redirectTarget);
        router.refresh();
      } else {
        setError(res.error || 'Invalid credentials or unauthorized administrator account.');
      }
    } catch {
      setError('An unexpected error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-950">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/30">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">ASTRAIV ADMIN PORTAL</h1>
          <p className="text-xs text-slate-400">
            Authorized administrator credentials required
          </p>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Administrator Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@astraiv.com"
                required
                autoComplete="email"
                className="pl-10 h-11 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Master Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoComplete="current-password"
                className="pl-10 pr-10 h-11 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 mt-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Access Control Center</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}


export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

