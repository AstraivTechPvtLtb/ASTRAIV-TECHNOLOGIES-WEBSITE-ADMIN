import type { Metadata } from 'next';
import './globals.css';
import { AdminSidebar } from '@/views/layouts/admin-sidebar';
import { getAdminUser } from '@/controllers/auth.controller';

export const metadata: Metadata = {
  title: 'AstraIV Admin Portal | Operations, Moderation & CMS',
  description: 'Enterprise control panel for AstraIV Technologies client inquiries, reviews, and CMS management.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await getAdminUser();

  return (
    <html lang="en" className="dark h-full">
      <body className="bg-slate-950 text-slate-100 h-screen flex overflow-hidden antialiased">
        {admin && <AdminSidebar user={{ name: admin.fullName, email: admin.email, role: admin.role }} />}
        <div className="flex-1 flex flex-col min-w-0 h-full bg-slate-950 overflow-y-auto">
          {children}
        </div>
      </body>
    </html>
  );
}
