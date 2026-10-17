'use client';

/**
 * @file admin/src/views/layouts/theme-toggle.tsx
 * @description [VIEW] Accessible Light / Dark / System mode theme switcher.
 * Provides immediate switching, persistent preferences, OS system detection,
 * WCAG 2.2 keyboard navigation, and zero hydration mismatch.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className, variant = 'segmented' }: { className?: string; variant?: 'segmented' | 'dropdown' }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!mounted) {
    // Render an accessible skeleton container with matching layout to prevent layout shift
    return (
      <div
        className={cn(
          'h-8.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-28 animate-pulse',
          className
        )}
        aria-hidden="true"
      />
    );
  }

  const currentTheme = theme || 'system';

  const modes: Array<{
    id: 'light' | 'dark' | 'system';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }> = [
    { id: 'light', label: 'Light', icon: Sun, description: 'Clean high-contrast daytime mode' },
    { id: 'dark', label: 'Dark', icon: Moon, description: 'Deep Astraiv tech slate mode' },
    { id: 'system', label: 'System', icon: Monitor, description: `Follows OS preference (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})` },
  ];

  // Segmented Pill Variant (Perfect for Header)
  if (variant === 'segmented') {
    return (
      <div
        role="radiogroup"
        aria-label="Theme selection"
        className={cn(
          'inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs select-none',
          className
        )}
      >
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentTheme === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={`${mode.label} Mode`}
              title={`${mode.label} Mode: ${mode.description}`}
              onClick={() => setTheme(mode.id)}
              className={cn(
                'relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600',
                isActive
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive && 'text-blue-600 dark:text-blue-400')} />
              <span className="hidden sm:inline text-[11px]">{mode.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown Variant
  const activeMode = modes.find((m) => m.id === currentTheme) || modes[2];
  const ActiveIcon = activeMode.icon;

  return (
    <div className={cn('relative inline-block text-left', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Select color theme"
        className="inline-flex items-center gap-2 h-8.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        <ActiveIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        <span className="capitalize">{activeMode.label}</span>
        <ChevronDown className="h-3 w-3 text-slate-400" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-1.5 w-44 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 text-xs font-medium animate-in fade-in-0 zoom-in-95 duration-100"
        >
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800/80 mb-1">
            Display Theme
          </div>
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = currentTheme === mode.id;

            return (
              <button
                key={mode.id}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => {
                  setTheme(mode.id);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer',
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  <div>
                    <span className="block leading-none">{mode.label}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                      {mode.id === 'system' ? `OS (${resolvedTheme})` : mode.label}
                    </span>
                  </div>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
