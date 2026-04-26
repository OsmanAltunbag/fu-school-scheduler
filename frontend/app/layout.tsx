import type { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'School Scheduler',
  description: 'Automated school timetabling system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
        <Sidebar />
        <main className="ml-[220px] p-8 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
