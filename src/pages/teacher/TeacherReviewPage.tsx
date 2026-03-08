import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherAssignments, useTeacherSubmissions } from '@/hooks/useData';
import { reviewSubmission } from '@/lib/db';
import { useToast } from '@/components/common/ToastProvider';
import { surahByNumber } from '@/constants/quran';

export function TeacherReviewPage() {
  const { authUser } = useAuth();
  const { data: submissions = [] } = useTeacherSubmissions(authUser?.uid);
  const { data: assignments = [] } = useTeacherAssignments(authUser?.uid);
  const { pushToast } = useToast();
  const [feedbackById, setFeedbackById] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'all' | 'submitted' | 'revision_requested' | 'approved'>('submitted');

  const assignmentById = useMemo(() => new Map(assignments.map((item) => [item.id, item])), [assignments]);

  const filtered = useMemo(() => {
    if (filter === 'all') return submissions;
    return submissions.filter((item) => item.status === filter);
  }, [filter, submissions]);

  async function handleReview(id: string, status: 'approved' | 'revision_requested') {
    try {
      await reviewSubmission(id, status, feedbackById[id]);
      pushToast(`Submission ${status === 'approved' ? 'approved' : 'sent for revision'}`, 'success');
    } catch (error) {
      pushToast((error as Error).message, 'error');
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Review Queue</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="mt-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="submitted">Submitted</option>
          <option value="revision_requested">Revision requested</option>
          <option value="approved">Approved</option>
          <option value="all">All</option>
        </select>
      </section>

      {filtered.length === 0 ? (
        <EmptyState title="No submissions" description="Submissions that need review will appear here." />
      ) : (
        filtered.map((submission) => (
          <article key={submission.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            {(() => {
              const assignment = assignmentById.get(submission.assignmentId);
              const surah = assignment ? surahByNumber(assignment.quranScope.surahNumber) : null;
              return (
                <div className="mb-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                  {assignment
                    ? `${surah?.nameEn ?? `Surah ${assignment.quranScope.surahNumber}`} - from ayah ${assignment.quranScope.ayahStart} to ${assignment.quranScope.ayahEnd}`
                    : 'Assignment details unavailable'}
                </div>
              );
            })()}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Assignment {submission.assignmentId.slice(0, 6)}</p>
                <p className="text-xs text-slate-500">Student: {submission.studentId}</p>
                <p className="mt-1 text-sm text-slate-700">{submission.content}</p>
                {submission.notes ? <p className="mt-1 text-xs text-slate-500">Notes: {submission.notes}</p> : null}
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize">{submission.status}</span>
            </div>

            <textarea
              value={feedbackById[submission.id] || ''}
              onChange={(e) => setFeedbackById((prev) => ({ ...prev, [submission.id]: e.target.value }))}
              className="mt-3 h-20 w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Feedback for student"
            />

            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => handleReview(submission.id, 'approved')}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => handleReview(submission.id, 'revision_requested')}
                className="rounded-lg bg-amber-600 px-3 py-2 text-sm text-white"
              >
                Request Revision
              </button>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
