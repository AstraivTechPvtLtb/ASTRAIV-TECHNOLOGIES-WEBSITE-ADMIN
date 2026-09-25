'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, LayoutDashboard } from 'lucide-react';
import { Button, buttonVariants } from '@/views/ui/button';
import { cn } from '@/lib/utils';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[Admin Portal Runtime Error]:', error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[80vh] p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold uppercase tracking-wider">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          Admin Error
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-heading">
            Operation Failed
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            An unexpected error occurred while loading this administrative view.
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-slate-500">
              Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button onClick={() => reset()} size="default" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Retry
          </Button>
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: 'outline', size: 'default' }), 'gap-2')}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
