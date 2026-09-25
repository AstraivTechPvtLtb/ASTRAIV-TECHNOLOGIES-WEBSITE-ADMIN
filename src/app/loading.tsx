import { Loader2 } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div className="flex-1 min-h-[70vh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
        Loading Admin Operations...
      </span>
    </div>
  );
}
