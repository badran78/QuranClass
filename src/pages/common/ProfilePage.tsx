import { Listbox } from '@headlessui/react';
import { ChevronDown, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/lib/db';
import { useToast } from '@/components/common/ToastProvider';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' }
] as const;

export function ProfilePage() {
  const { profile, logout, refreshProfile } = useAuth();
  const { pushToast } = useToast();
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  async function handleLanguageChange(language: 'en' | 'ar') {
    if (!profile) return;
    try {
      setSaving(true);
      await updateUserProfile(profile.uid, { language });
      await refreshProfile();
      pushToast('Language updated', 'success');
    } catch (error) {
      pushToast((error as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-slate-600">{profile.displayName}</p>
        <p className="text-sm text-slate-500">{profile.email}</p>
        <p className="text-sm capitalize text-slate-500">Role: {profile.role}</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold">Language</h3>
        <Listbox value={profile.language} onChange={handleLanguageChange}>
          <div className="relative mt-2">
            <Listbox.Button className="flex w-full items-center justify-between rounded-lg border border-slate-300 px-3 py-2 text-left">
              <span>{languages.find((l) => l.code === profile.language)?.label}</span>
              <ChevronDown size={16} />
            </Listbox.Button>
            <Listbox.Options className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              {languages.map((lang) => (
                <Listbox.Option key={lang.code} value={lang.code} className="cursor-pointer px-3 py-2 ui-active:bg-slate-100">
                  {lang.label}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>
        {saving ? <p className="mt-2 text-xs text-slate-500">Saving...</p> : null}
      </section>

      <button
        type="button"
        onClick={logout}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-rose-700"
      >
        <LogOut size={16} /> Logout
      </button>
    </div>
  );
}
