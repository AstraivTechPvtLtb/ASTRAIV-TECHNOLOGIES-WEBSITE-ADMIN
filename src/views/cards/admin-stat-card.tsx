import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/views/ui/card';
import { Badge } from '@/views/ui/badge';
import { cn } from '@/lib/utils';

interface AdminStatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  iconColor?: string;
  badge?: string;
  className?: string;
}

export function AdminStatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-blue-600 dark:text-blue-400',
  badge,
  className,
}: AdminStatCardProps) {
  return (
    <Card className={cn('bg-white dark:bg-slate-900/80 border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xs dark:shadow-sm relative overflow-hidden transition-all hover:shadow-md hover:border-blue-500/30', className)}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">{title}</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</div>
            {description && <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">{description}</p>}
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className={cn('p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 transition-colors', iconColor)}>
              <Icon className="h-5 w-5" />
            </div>
            {badge && (
              <Badge variant="outline" className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 font-bold whitespace-nowrap">
                {badge}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
