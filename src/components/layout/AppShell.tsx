import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNav } from './BottomNav';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export function AppShell() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-base font-semibold text-brand-900">{t('appName')}</h1>
            <p className="text-xs text-slate-500">{profile.displayName}</p>
          </div>
          <NotificationCenter />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-4 pb-24">
        <Outlet />
      </main>

      <BottomNav role={profile.role} />
    </div>
  );
}
