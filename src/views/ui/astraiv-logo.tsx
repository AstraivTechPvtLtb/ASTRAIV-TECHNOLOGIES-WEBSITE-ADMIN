'use client';

/**
 * @file admin/src/views/ui/astraiv-logo.tsx
 * @description [VIEW] Official Astraiv Technologies brand logo component.
 * Replaces generic shield branding with authentic Astraiv emblem (/logo-icon.jpg)
 * and typography across expanded sidebar, collapsed sidebar, mobile drawer,
 * header, and login page.
 */

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AstraivBrandLogoProps {
  variant?: 'full' | 'icon' | 'login';
  className?: string;
  href?: string;
  showSubtitle?: boolean;
  subtitleText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AstraivBrandLogo({
  variant = 'full',
  className,
  href = '/dashboard',
  showSubtitle = true,
  subtitleText = 'PORTAL V2.0',
  size = 'md',
}: AstraivBrandLogoProps) {
  const iconDimensions = {
    sm: { width: 28, height: 28, box: 'h-7 w-7' },
    md: { width: 36, height: 36, box: 'h-9 w-9' },
    lg: { width: 48, height: 48, box: 'h-12 w-12' },
  }[size];

  const content = (
    <div className={cn('flex items-center gap-3 select-none group', className)}>
      {/* Official Astraiv Hexagonal Emblem Badge */}
      <div
        className={cn(
          'relative rounded-xl overflow-hidden shadow-md transition-all duration-300 ring-2 ring-blue-500/20 group-hover:ring-blue-500/40 shrink-0 bg-slate-950 flex items-center justify-center',
          iconDimensions.box
        )}
      >
        <Image
          src="/logo-icon.jpg"
          alt="Astraiv Technologies Logo"
          width={iconDimensions.width}
          height={iconDimensions.height}
          priority
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Typography with official Astraiv tech gradient */}
      {variant !== 'icon' && (
        <div className="flex flex-col text-left leading-tight">
          <span className="font-black text-sm tracking-wider bg-linear-to-r from-[#0B3D91] via-[#5B5FEF] to-[#0099FF] dark:from-[#2563EB] dark:via-[#3B82F6] dark:to-[#60A5FA] bg-clip-text text-transparent">
            ASTRAIV ADMIN
          </span>
          {showSubtitle && (
            <span className="text-[9px] font-mono font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {subtitleText}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
}
