'use client';

/**
 * @file admin/src/views/layouts/admin-header.tsx
 * @description [VIEW] Top navigation header with page title, database indicator, and security status.
 */

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Link from 'next/link';
import { ShieldCheck, Database, Bell, BellRing, X, ArrowRight } from 'lucide-react';
import { Badge } from '@/views/ui/badge';
import { Button } from '@/views/ui/button';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
}

export function AdminHeader({ title, subtitle, badge }: AdminHeaderProps) {
  const [headerAlert, setHeaderAlert] = useState<{
    id: string;
    name: string;
    service: string;
    email: string;
  } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4001';
    try {
      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 15,
        reconnectionDelay: 2000,
      });

      socket.on('new_enquiry', (data: { id: string; name: string; service: string; email: string }) => {
        if (!data || !data.id) return;
        setUnreadCount((c) => c + 1);
        setHeaderAlert({
          id: data.id,
          name: data.name,
          service: data.service,
          email: data.email,
        });
      });

      return () => {
        socket.disconnect();
      };
    } catch {
      // Non-blocking
    }
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-8 py-4 bg-slate-900/60 backdrop-blur-xl border-b border-slate-800">
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black tracking-tight text-white">{title}</h1>
            {badge && (
              <Badge variant="outline" className="text-[10px] bg-blue-500/10 border-blue-500/30 text-blue-400 font-bold">
                {badge}
              </Badge>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          {/* Socket Enquiries Quick Link & Bell */}
          <Link
            href="/enquiries"
            className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="View Enquiries"
          >
            {unreadCount > 0 ? (
              <BellRing className="h-4 w-4 text-blue-400 animate-bounce" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-blue-600 text-[10px] font-black text-white flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* System Health indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px]">PostgreSQL Connected</span>
          </div>

          {/* Security indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="hidden md:inline text-[11px]">RLS Active</span>
          </div>
        </div>
      </header>

      {/* Floating Real-Time Toast for Global Admin Awareness */}
      {headerAlert && (
        <div className="fixed top-20 right-6 z-50 max-w-sm p-4 rounded-2xl bg-slate-900/95 border-2 border-blue-500 shadow-2xl shadow-blue-500/20 backdrop-blur-xl animate-in slide-in-from-top-3 fade-in duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                <BellRing className="h-4 w-4 animate-bounce" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-white block">New Live Enquiry</span>
                <p className="text-slate-300 mt-0.5">
                  <strong className="text-white">{headerAlert.name}</strong> •{' '}
                  <span className="text-blue-400 font-semibold">{headerAlert.service}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setHeaderAlert(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800 flex justify-end">
            <Link
              href="/enquiries"
              onClick={() => setHeaderAlert(null)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300"
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
