import { FormEvent, useState } from 'react';
import { z } from 'zod';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentClasses } from '@/hooks/useData';
import { requestJoinByInvitationCode } from '@/lib/db';
import { useToast } from '@/components/common/ToastProvider';

const schema = z.object({
  invitationCode: z.string().min(4).max(10)
});

export function StudentClassesPage() {
  const { authUser, profile } = useAuth();
  const { data: classes = [] } = useStudentClasses(authUser?.uid);
  const { pushToast } = useToast();
  const [invitationCode, setInvitationCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authUser || !profile) return;

    const parsed = schema.safeParse({ invitationCode });
    if (!parsed.success) {
      pushToast('Invalid invitation code', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await requestJoinByInvitationCode(authUser.uid, profile.displayName, parsed.data.invitationCode);
      pushToast('Join request sent', 'success');
      setInvitationCode('');
    } catch (error) {
      pushToast((error as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Join a Class</h2>
        <p className="text-sm text-slate-500">Enter the invitation code shared by your teacher.</p>
        <form onSubmit={handleJoin} className="mt-3 flex gap-2">
          <input
            value={invitationCode}
            onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 uppercase"
            placeholder="ABC123"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Request
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">My Classes</h2>
        {classes.length === 0 ? (
          <EmptyState title="No classes yet" description="Join a class using invitation code to get started." />
        ) : (
          classes.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold text-slate-900">{item.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{item.description || 'No description'}</p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
