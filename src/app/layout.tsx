import type { Metadata } from 'next';
import './globals.css';
import { AdminSidebar } from '@/views/layouts/admin-sidebar';
import { getAdminUser } from '@/controllers/auth.controller';

export const metadata: Metadata = {
  title: 'AstraIV Admin Portal | Operations, Moderation & CMS',
  description: 'Enterprise control panel for AstraIV Technologies client inquiries, reviews, and CMS management.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await getAdminUser();

  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex antialiased">
        {admin && <AdminSidebar user={{ name: admin.fullName, email: admin.email, role: admin.role }} />}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
          {children}
        </div>
      </body>
    </html>
  );
}
