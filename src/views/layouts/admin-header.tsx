'use client';

/**
 * @file admin/src/views/layouts/admin-header.tsx
 * @description [VIEW] Top navigation header with page title, theme switcher,
 * mobile drawer trigger, live enquiry alerts, database status, and security indicators.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Database, Bell, BellRing, X, ArrowRight, Menu } from 'lucide-react';
import { Badge } from '@/views/ui/badge';
import { enquiryPoller } from '@/lib/enquiry-poller';
import { ThemeToggle } from '@/views/layouts/theme-toggle';
import { useSidebar } from '@/views/layouts/sidebar-context';
import { AstraivBrandLogo } from '@/views/ui/astraiv-logo';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
}

export function AdminHeader({ title, subtitle, badge }: AdminHeaderProps) {
  const { toggleMobile } = useSidebar();
  const [headerAlert, setHeaderAlert] = useState<{
    id: string;
    service: string;
  } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribe = enquiryPoller.subscribe((event) => {
      if (!event.newEnquiries || event.newEnquiries.length === 0) return;
      setUnreadCount((c) => c + event.newEnquiries.length);
      const latest = event.newEnquiries[0];
      setHeaderAlert({
        id: latest.id,
        service: latest.service,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border-b border-slate-200/90 dark:border-slate-800 transition-colors shadow-2xs dark:shadow-none">
        {/* Left: Hamburger (mobile), Mobile Logo, Title & Subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Navigation Drawer Trigger */}
          <button
            type="button"
            onClick={toggleMobile}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0"
            aria-label="Open navigation menu"
            title="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile Logo preview on small viewports */}
          <div className="lg:hidden shrink-0">
            <AstraivBrandLogo variant="icon" size="sm" />
          </div>

          <div className="flex flex-col text-left min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white truncate">
                {title}
              </h1>
              {badge && (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold shrink-0"
                >
                  {badge}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Global Controls (Theme Switcher, Enquiries Bell, Status Badges) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Theme Switcher (Light / Dark / System) */}
          <ThemeToggle />

          {/* Enquiries Quick Link & Bell */}
          <Link
            href="/enquiries"
            className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shadow-2xs dark:shadow-none"
            title="View Enquiries"
            aria-label={`View enquiries${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            {unreadCount > 0 ? (
              <BellRing className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-bounce" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-blue-600 text-[10px] font-black text-white flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* System Health Indicator (PostgreSQL) */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-2xs dark:shadow-none">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span className="text-[11px]">PostgreSQL</span>
          </div>

          {/* Security Status Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="text-[11px]">RLS Active</span>
          </div>
        </div>
      </header>

      {/* Floating Real-Time Toast for Global Admin Awareness */}
      {headerAlert && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 border-2 border-blue-500 shadow-2xl shadow-blue-500/20 backdrop-blur-xl animate-in slide-in-from-top-3 fade-in duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-600/15 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                <BellRing className="h-4 w-4 animate-bounce" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">New Live Enquiry</span>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                  <strong className="text-slate-900 dark:text-white">New Submission</strong> •{' '}
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">{headerAlert.service}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setHeaderAlert(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Dismiss alert"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Link
              href="/enquiries"
              onClick={() => setHeaderAlert(null)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>Inspect in Enquiries</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
