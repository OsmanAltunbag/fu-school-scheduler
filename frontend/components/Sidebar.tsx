'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/teachers', label: 'Teachers', icon: '👨‍🏫' },
  { href: '/classes', label: 'Classes', icon: '🏫' },
  { href: '/subjects', label: 'Subjects', icon: '📚' },
  { href: '/courses', label: 'Courses', icon: '📖' },
  { href: '/schedule', label: 'Schedule', icon: '🗓️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 h-screen w-[220px] bg-white border-r border-slate-200 flex flex-col z-40">
      <div className="px-5 py-5 border-b border-slate-200">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-xl">📅</span>
          <span className="font-bold text-base text-slate-900 tracking-tight group-hover:text-slate-600 transition-colors">
            Scheduler
          </span>
        </Link>
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navLinks.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors border-l-2 ${
                active
                  ? 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="text-base leading-none">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
