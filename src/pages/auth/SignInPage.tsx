import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/common/ToastProvider';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export function SignInPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      pushToast('Enter a valid email/password', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await signIn(form.email, form.password);
      navigate('/');
    } catch (error) {
      pushToast((error as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">Sign in to QuranClass</h1>
      <p className="mt-1 text-sm text-slate-500">Track memorization, wird, and submissions in real time.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
        <button
          disabled={submitting}
          type="submit"
          className="w-full rounded-lg bg-brand-700 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        No account?{' '}
        <Link to="/signup" className="font-medium text-brand-700">
          Create one
        </Link>
      </p>
    </div>
  );
}
