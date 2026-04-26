import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'School Scheduler',
  description: 'Automated school timetabling system',
};

const navLinks = [
  { href: '/teachers', label: 'Teachers' },
  { href: '/classes', label: 'Classes' },
  { href: '/subjects', label: 'Subjects' },
  { href: '/courses', label: 'Courses' },
  { href: '/schedule', label: 'Schedule' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
          <Link href="/" className="font-semibold text-lg text-blue-600 mr-4">
            School Scheduler
          </Link>
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
