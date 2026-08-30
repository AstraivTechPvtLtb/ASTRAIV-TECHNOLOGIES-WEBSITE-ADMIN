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
  iconColor = 'text-blue-400',
  badge,
  className,
}: AdminStatCardProps) {
  return (
    <Card className={cn('bg-slate-900/80 border-slate-800 text-slate-100 shadow-sm relative overflow-hidden', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">{title}</span>
            <div className="text-2xl font-extrabold text-white tracking-tight">{value}</div>
            {description && <p className="text-[11px] text-slate-500 font-medium">{description}</p>}
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className={cn('p-2.5 rounded-xl bg-slate-950/80 border border-slate-800', iconColor)}>
              <Icon className="h-5 w-5" />
            </div>
            {badge && (
              <Badge variant="outline" className="text-[9px] bg-blue-500/10 text-blue-400 border-blue-500/30">
                {badge}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
