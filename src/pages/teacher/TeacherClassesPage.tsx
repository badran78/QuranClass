import { FormEvent, useMemo, useState } from 'react';
import { z } from 'zod';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useClassMembers, useJoinRequests, useTeacherClasses } from '@/hooks/useData';
import { createClass, decideJoinRequest } from '@/lib/db';
import { useToast } from '@/components/common/ToastProvider';

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional()
});

export function TeacherClassesPage() {
  const { authUser } = useAuth();
  const { data: classes = [] } = useTeacherClasses(authUser?.uid);
  const { pushToast } = useToast();
  const [form, setForm] = useState({ name: '', description: '' });
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>();

  const activeClassId = selectedClassId || classes[0]?.id;
  const { data: requests = [] } = useJoinRequests(activeClassId);
  const { data: members = [] } = useClassMembers(activeClassId);

  const selectedClass = useMemo(() => classes.find((item) => item.id === activeClassId), [classes, activeClassId]);

  async function handleCreateClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authUser) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      pushToast('Class name is required', 'error');
      return;
    }

    try {
      await createClass(authUser.uid, parsed.data.name, parsed.data.description);
      setForm({ name: '', description: '' });
      pushToast('Class created', 'success');
    } catch (error) {
      pushToast((error as Error).message, 'error');
    }
  }

  async function handleDecision(requestId: string, decision: 'accepted' | 'rejected') {
    if (!activeClassId) return;
    try {
      await decideJoinRequest(activeClassId, requestId, decision);
      pushToast(`Request ${decision}`, 'success');
    } catch (error) {
      pushToast((error as Error).message, 'error');
    }
  }

  async function handleCopyInviteCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      pushToast('Invite code copied', 'success');
    } catch {
      pushToast('Could not copy invite code', 'error');
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Create Class</h2>
        <form onSubmit={handleCreateClass} className="mt-3 space-y-2">
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Class name"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            className="h-20 w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Optional description"
          />
          <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-white">
            Create
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">My Classes</h2>
        {classes.length === 0 ? (
          <EmptyState title="No classes" description="Create your first class to start inviting students." />
        ) : (
          <div className="mt-3 space-y-2">
            {classes.map((item) => (
              <div
                key={item.id}
                className={`w-full rounded-lg border px-3 py-2 text-left ${activeClassId === item.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200'}`}
              >
                <button type="button" onClick={() => setSelectedClassId(item.id)} className="w-full text-left">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-slate-500">Invite Code: {item.invitationCode}</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyInviteCode(item.invitationCode)}
                  className="mt-2 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700"
                >
                  Copy code
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedClass ? (
        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold">Pending Join Requests</h3>
            <div className="mt-3 space-y-2">
              {requests.filter((r) => r.status === 'pending').map((request) => (
                <div key={request.id} className="rounded-lg border border-slate-100 p-2">
                  <p className="text-sm font-medium">{request.studentName}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDecision(request.id, 'accepted')}
                      className="rounded-md bg-emerald-600 px-3 py-1 text-xs text-white"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(request.id, 'rejected')}
                      className="rounded-md bg-rose-600 px-3 py-1 text-xs text-white"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
              {requests.filter((r) => r.status === 'pending').length === 0 ? (
                <p className="text-sm text-slate-500">No pending requests.</p>
              ) : null}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold">Active Students</h3>
            <div className="mt-3 space-y-2">
              {members.map((member) => (
                <div key={member.uid} className="rounded-lg border border-slate-100 p-2 text-sm">
                  {member.displayName || member.uid}
                </div>
              ))}
              {members.length === 0 ? <p className="text-sm text-slate-500">No students yet.</p> : null}
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}
