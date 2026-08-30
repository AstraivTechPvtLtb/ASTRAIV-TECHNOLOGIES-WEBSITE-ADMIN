'use client';

/**
 * @file admin/src/views/layouts/admin-sidebar.tsx
 * @description [VIEW] Navigation sidebar for Astraiv Admin Portal.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Star,
  FolderKanban,
  Cpu,
  FileText,
  Settings,
  Shield,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/views/ui/button';

interface AdminSidebarProps {
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Enquiries', href: '/enquiries', icon: MessageSquare },
    { name: 'Reviews Queue', href: '/reviews', icon: Star },
    { name: 'Projects CMS', href: '/projects', icon: FolderKanban },
    { name: 'Services Catalog', href: '/services', icon: Cpu },
    { name: 'Blog Articles', href: '/blog', icon: FileText },
    { name: 'Settings & Sync', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col justify-between min-h-screen text-slate-300 select-none">
      <div className="flex flex-col">
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm tracking-wider text-white">ASTRAIV ADMIN</span>
            <span className="text-[10px] text-blue-400 font-mono font-bold tracking-tight">
              PORTAL V2.0
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-4 space-y-1.5">
          <div className="px-3 py-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Operations
          </div>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150',
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Profile & Switcher */}
      <div className="p-4 border-t border-slate-800/80 space-y-3">
        {/* View Client Site shortcut */}
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium transition-colors"
        >
          <span>Live Client Website</span>
          <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
        </a>

        {/* User Card */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-400 shrink-0">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-200 truncate">
                {user?.name || 'Administrator'}
              </span>
              <span className="block text-[10px] text-slate-500 truncate">
                {user?.email || 'admin@astraiv.com'}
              </span>
            </div>
          </div>

          <Link href="/login">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  );
}
