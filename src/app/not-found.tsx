import Link from 'next/link';
import { Compass, LayoutDashboard } from 'lucide-react';
import { buttonVariants } from '@/views/ui/button';
import { cn } from '@/lib/utils';

export default function AdminNotFound() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[80vh] p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
          Admin Portal • 404
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white font-heading">
            Admin View Not Found
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            The administrative resource, table view, or settings page you requested does not exist or has been moved.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: 'default', size: 'default' }), 'gap-2')}
          >
            <LayoutDashboard className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
