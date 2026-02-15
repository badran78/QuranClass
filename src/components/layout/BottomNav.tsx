import { BookOpen, ChartColumn, CheckCheck, Home, ListTodo, User, Users, type LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserRole } from '@/types';
import { cn } from '@/lib/utils';

interface TabItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

function tabsForRole(role: UserRole, t: (key: string) => string): TabItem[] {
  if (role === 'teacher') {
    return [
      { to: '/teacher/classes', label: t('nav.classes'), icon: Home },
      { to: '/teacher/students', label: t('nav.students'), icon: Users },
      { to: '/teacher/review', label: t('nav.review'), icon: CheckCheck },
      { to: '/teacher/analytics', label: t('nav.analytics'), icon: ChartColumn },
      { to: '/teacher/profile', label: t('nav.profile'), icon: User }
    ];
  }

  return [
    { to: '/student/classes', label: t('nav.classes'), icon: Home },
    { to: '/student/assignments', label: t('nav.assignments'), icon: ListTodo },
    { to: '/student/submit', label: t('nav.submit'), icon: BookOpen },
    { to: '/student/status', label: t('nav.status'), icon: ChartColumn },
    { to: '/student/profile', label: t('nav.profile'), icon: User }
  ];
}

export function BottomNav({ role }: { role: UserRole }) {
  const location = useLocation();
  const { t } = useTranslation();
  const tabs = tabsForRole(role, t);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white pb-safe">
      <ul className="mx-auto grid max-w-3xl grid-cols-5">
        {tabs.map((tab) => {
          const active = location.pathname.startsWith(tab.to);
          const Icon = tab.icon;
          return (
            <li key={tab.to}>
              <Link
                to={tab.to}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-medium',
                  active ? 'text-brand-700' : 'text-slate-500'
                )}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
