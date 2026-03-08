import { useMemo } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentAssignments, useStudentClasses, useStudentSubmissions } from '@/hooks/useData';
import { formatDate } from '@/lib/utils';
import { surahByNumber } from '@/constants/quran';

export function StudentAssignmentsPage() {
  const { authUser } = useAuth();
  const { data: assignments = [] } = useStudentAssignments(authUser?.uid);
  const { data: classes = [] } = useStudentClasses(authUser?.uid);
  const { data: submissions = [] } = useStudentSubmissions(authUser?.uid);

  const grouped = useMemo(() => {
    return assignments.reduce<Record<string, typeof assignments>>((acc, assignment) => {
      const key = assignment.classId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(assignment);
      return acc;
    }, {});
  }, [assignments, classes]);

  const latestSubmissionByAssignment = useMemo(() => {
    const map = new Map<string, string>();
    submissions.forEach((submission) => {
      if (!map.has(submission.assignmentId)) {
        map.set(submission.assignmentId, submission.status);
      }
    });
    return map;
  }, [submissions]);

  if (assignments.length === 0) {
    return <EmptyState title="No assignments" description="Your teacher will add your assignments here." />;
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([classId, classAssignments]) => {
        const title = classes.find((item) => item.id === classId)?.name || 'Class';
        return (
          <section key={classId} className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-base font-semibold">{title}</h2>
            <div className="mt-3 space-y-3">
              {classAssignments.map((assignment) => {
                const surah = surahByNumber(assignment.quranScope.surahNumber);
                return (
                  <article key={assignment.id} className="rounded-xl border border-slate-100 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium capitalize">{assignment.type}</p>
                        <p className="text-xs text-slate-500">
                          {surah?.nameEn} ({surah?.nameAr}) - from ayah {assignment.quranScope.ayahStart} to{' '}
                          {assignment.quranScope.ayahEnd}
                        </p>
                        <p className="text-xs text-slate-500">Due: {formatDate(assignment.dueDate)}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                        {latestSubmissionByAssignment.get(assignment.id) || 'pending'}
                      </span>
                    </div>
                    {assignment.amount?.notes ? (
                      <p className="mt-2 text-xs text-slate-600">Teacher notes: {assignment.amount.notes}</p>
                    ) : null}
                    <div className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
                      <p>Submission timeline:</p>
                      {submissions
                        .filter((submission) => submission.assignmentId === assignment.id)
                        .slice(0, 3)
                        .map((submission) => (
                          <p key={submission.id}>
                            {submission.status} - {submission.feedback || 'No feedback'}
                          </p>
                        ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
