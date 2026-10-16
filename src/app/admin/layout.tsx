import React from 'react';
import type { Metadata } from 'next';
import { getSessionUser } from '@/lib/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Admin Dashboard — Toto Elite Mart',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/logo.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/logo.png',
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  // If user is not authenticated, let the login page handle itself or redirect
  // Note: /admin/login handles its own layout if user is null
  return (
    <div className="min-h-screen bg-slate-100 flex">
      {user && <AdminSidebar />}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {user && <AdminHeader user={user} />}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
