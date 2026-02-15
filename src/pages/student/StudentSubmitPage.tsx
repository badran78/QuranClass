import { FormEvent, useMemo, useState } from 'react';
import { z } from 'zod';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentAssignments } from '@/hooks/useData';
import { submitAssignment } from '@/lib/db';
import { useToast } from '@/components/common/ToastProvider';

const schema = z.object({
  assignmentId: z.string().min(1),
  content: z.string().min(3),
  notes: z.string().optional()
});

export function StudentSubmitPage() {
  const { authUser } = useAuth();
  const { data: assignments = [] } = useStudentAssignments(authUser?.uid);
  const { pushToast } = useToast();

  const [form, setForm] = useState({ assignmentId: '', content: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const selectedAssignment = useMemo(() => assignments.find((item) => item.id === form.assignmentId), [assignments, form.assignmentId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authUser || !selectedAssignment) return;

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      pushToast('Please complete all required fields', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await submitAssignment({
        assignmentId: selectedAssignment.id,
        classId: selectedAssignment.classId,
        studentId: authUser.uid,
        teacherId: selectedAssignment.teacherId,
        content: parsed.data.content,
        notes: parsed.data.notes
      });
      setForm({ assignmentId: '', content: '', notes: '' });
      pushToast('Submission sent for review', 'success');
    } catch (error) {
      pushToast((error as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (assignments.length === 0) {
    return <EmptyState title="No assignments" description="You need an assignment before submitting." />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold">Quick Submit</h2>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Assignment</span>
        <select
          value={form.assignmentId}
          onChange={(e) => setForm((prev) => ({ ...prev, assignmentId: e.target.value }))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="">Select assignment</option>
          {assignments.map((item) => (
            <option key={item.id} value={item.id}>
              {item.type} - Surah {item.quranScope.surahNumber} ({item.quranScope.ayahStart}-{item.quranScope.ayahEnd})
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">What did you complete?</span>
        <textarea
          value={form.content}
          onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
          className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Describe what you recited/read"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Notes (optional)</span>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          className="h-20 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <button
        disabled={submitting}
        type="submit"
        className="w-full rounded-lg bg-brand-700 px-4 py-2 text-white disabled:opacity-60"
      >
        {submitting ? 'Submitting...' : 'Submit to Teacher'}
      </button>
    </form>
  );
}
