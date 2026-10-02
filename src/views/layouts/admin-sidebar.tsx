'use client';

/**
 * @file admin/src/views/layouts/admin-sidebar.tsx
 * @description [VIEW] Organized, category-grouped navigation sidebar for Astraiv Admin Portal V2.0.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  Layers,
  Cpu,
  Sparkles,
  Building2,
  Terminal,
  FolderKanban,
  Star,
  FileText,
  Award,
  HelpCircle,
  CreditCard,
  Briefcase,
  Target,
  MessageSquare,
  Users,
  PanelBottom,
  Building,
  Image as ImageIcon,
  Search,
  Network,
  Eye,
  ShieldCheck,
  Scale,
  FileCheck,
  Settings,
  Activity,
  History,
  Shield,
  LogOut,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/views/ui/button';
import { logoutAdmin } from '@/controllers/auth.controller';

interface AdminSidebarProps {
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'overview',
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Analytics & Telemetry', href: '/analytics', icon: BarChart3 },
    ],
  },
  {
    id: 'content',
    title: 'Website Content',
    items: [
      { name: 'Standalone Pages', href: '/pages', icon: Layers },
      { name: 'Services Catalog', href: '/services', icon: Cpu },
      { name: 'Solutions', href: '/solutions', icon: Sparkles },
      { name: 'Industries', href: '/industries', icon: Building2 },
      { name: 'Tech Stack', href: '/technologies', icon: Terminal },
      { name: 'Projects & Work', href: '/projects', icon: FolderKanban },
      { name: 'Testimonials & Reviews', href: '/reviews', icon: Star },
      { name: 'Insights & Blog', href: '/blog', icon: FileText },
      { name: 'Trust & Credentials', href: '/trust', icon: Award },
      { name: 'FAQs', href: '/faqs', icon: HelpCircle },
      { name: 'Pricing & Models', href: '/pricing', icon: CreditCard },
      { name: 'Careers & Roles', href: '/recruitment', icon: Briefcase },
    ],
  },
  {
    id: 'inbox',
    title: 'Business Inbox',
    items: [
      { name: 'Project Requests (CRM)', href: '/leads', icon: Target },
      { name: 'General Enquiries', href: '/enquiries', icon: MessageSquare },
      { name: 'Job Applications', href: '/recruitment/applications', icon: Users },
    ],
  },
  {
    id: 'setup',
    title: 'Website Setup',
    items: [
      { name: 'Navigation & Footer', href: '/footer', icon: PanelBottom },
      { name: 'Company & Contact', href: '/setup/company', icon: Building },
      { name: 'Media Library', href: '/media', icon: ImageIcon },
      { name: 'SEO & Redirects', href: '/seo', icon: Search },
      { name: 'Content Relationships', href: '/relationships', icon: Network },
      { name: 'Visibility & Publishing', href: '/publishing', icon: Eye },
    ],
  },
  {
    id: 'legal',
    title: 'Legal Governance',
    items: [
      { name: 'Privacy Policy', href: '/legal/privacy', icon: ShieldCheck, badge: 'Versioned', badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
      { name: 'Terms of Service', href: '/legal/terms', icon: Scale, badge: 'Versioned', badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
      { name: 'Legal Identity & DPA', href: '/legal/identity', icon: FileCheck },
    ],
  },
  {
    id: 'system',
    title: 'System & Operations',
    items: [
      { name: 'Settings & Integrations', href: '/settings', icon: Settings },
      { name: 'Sync & Telemetry', href: '/system/sync', icon: Activity },
      { name: 'Activity History', href: '/system/activity', icon: History },
    ],
  },
];

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (id: string) => {
    setCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSignOut = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutAdmin();
      router.push('/login');
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="w-64 shrink-0 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between h-screen sticky top-0 text-slate-300 select-none overflow-y-auto overflow-x-hidden">
      <div className="flex flex-col">
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-800/80 shrink-0 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xs tracking-wider text-white">ASTRAIV ADMIN</span>
            <span className="text-[10px] text-blue-400 font-mono font-bold tracking-tight">
              PORTAL V2.0
            </span>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="p-3 space-y-4 pb-6">
          {NAV_GROUPS.map((group) => {
            const isCollapsed = collapsedGroups[group.id];
            const hasActiveItem = group.items.some(
              item => pathname === item.href || pathname.startsWith(item.href + '/')
            );

            return (
              <div key={group.id} className="space-y-1">
                {/* Group Header Button */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-400 hover:text-slate-200 uppercase transition-colors"
                >
                  <span className={cn(hasActiveItem && 'text-blue-400 font-extrabold')}>{group.title}</span>
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-slate-500" />
                  )}
                </button>

                {/* Group Items */}
                {!isCollapsed && (
                  <div className="space-y-0.5 pt-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group',
                            isActive
                              ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30'
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon className={cn('h-3.5 w-3.5 shrink-0 transition-colors', isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200')} />
                            <span className="truncate">{item.name}</span>
                          </div>

                          {item.badge && (
                            <span className={cn('text-[9px] px-1.5 py-0.2 rounded-md font-mono shrink-0 ml-1', item.badgeColor || 'bg-blue-500/20 text-blue-300')}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Profile & Switcher */}
      <div className="p-3 border-t border-slate-800/80 space-y-2.5 shrink-0 bg-slate-950/90 backdrop-blur-md sticky bottom-0">
        {/* View Client Site shortcut */}
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium transition-colors"
        >
          <span>Live Client Website</span>
          <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
        </a>

        {/* User Card */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-800/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-400 shrink-0">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-200 truncate">
                {user?.name || 'Administrator'}
              </span>
              <span className="block text-[10px] text-slate-500 truncate">
                {user?.email || 'astraivtechnologies@gmail.com'}
              </span>
            </div>
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
