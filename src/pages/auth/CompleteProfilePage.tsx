import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { createUserProfile } from '@/lib/db';
import { useToast } from '@/components/common/ToastProvider';
import { UserRole } from '@/types';

const schema = z.object({
  displayName: z.string().min(2),
  role: z.enum(['student', 'teacher'])
});

export function CompleteProfilePage() {
  const navigate = useNavigate();
  const { authUser, refreshProfile } = useAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState({ displayName: '', role: 'student' as UserRole });
  const [saving, setSaving] = useState(false);

  if (!authUser) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authUser) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      pushToast('Please provide your name and role', 'error');
      return;
    }

    try {
      setSaving(true);
      await createUserProfile({
        uid: authUser.uid,
        email: authUser.email || '',
        displayName: parsed.data.displayName,
        role: parsed.data.role,
        language: 'en'
      });
      await refreshProfile();
      pushToast('Profile completed', 'success');
      navigate('/', { replace: true });
    } catch (error) {
      pushToast((error as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto mt-14 max-w-md rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-xl font-semibold">Complete your profile</h1>
      <p className="mt-1 text-sm text-slate-500">Your account exists, but profile setup is required to continue.</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Name</span>
          <input
            value={form.displayName}
            onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Role</span>
          <select
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as UserRole }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </label>

        <button
          disabled={saving}
          type="submit"
          className="w-full rounded-lg bg-brand-700 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Continue'}
        </button>
      </form>
    </div>
  );
}
