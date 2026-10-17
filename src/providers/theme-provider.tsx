'use client';

/**
 * @file admin/src/providers/theme-provider.tsx
 * @description [PROVIDER] Centralized next-themes provider for Astraiv Admin Portal.
 * Supports 'light', 'dark', and 'system' color scheme preferences with zero hydration mismatch.
 */

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
