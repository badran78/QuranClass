import { Listbox } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { useToast } from '@/components/common/ToastProvider';

const schema = z.object({
  displayName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['student', 'teacher'])
});

export function SignUpPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState({ displayName: '', email: '', password: '', role: 'student' as UserRole });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      pushToast('Please fill all fields correctly', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await signUp(parsed.data);
      navigate('/');
    } catch (error) {
      pushToast((error as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">Create QuranClass Account</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
          <span className="mb-1 block text-sm font-medium">Email</span>
          <input
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            type="email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Password</span>
          <input
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            type="password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            required
          />
        </label>

        <div>
          <span className="mb-1 block text-sm font-medium">Role</span>
          <Listbox value={form.role} onChange={(role) => setForm((prev) => ({ ...prev, role }))}>
            <div className="relative">
              <Listbox.Button className="flex w-full items-center justify-between rounded-lg border border-slate-300 px-3 py-2 text-left">
                <span className="capitalize">{form.role}</span>
                <ChevronDown size={16} className="text-slate-500" />
              </Listbox.Button>
              <Listbox.Options className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <Listbox.Option value="student" className="cursor-pointer px-3 py-2 ui-active:bg-slate-100">
                  Student
                </Listbox.Option>
                <Listbox.Option value="teacher" className="cursor-pointer px-3 py-2 ui-active:bg-slate-100">
                  Teacher
                </Listbox.Option>
              </Listbox.Options>
            </div>
          </Listbox>
        </div>

        <button
          disabled={submitting}
          type="submit"
          className="w-full rounded-lg bg-brand-700 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {submitting ? 'Creating...' : 'Create account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        Already have an account?{' '}
        <Link to="/signin" className="font-medium text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
