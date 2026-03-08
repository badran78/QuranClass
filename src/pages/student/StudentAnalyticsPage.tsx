import { useMemo, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentAssignments, useStudentSubmissions } from '@/hooks/useData';
import { useAnalytics } from '@/hooks/useAnalytics';
import { surahByNumber } from '@/constants/quran';

const COLORS = ['#16a34a', '#dc2626'];

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 h-56">{children}</div>
    </section>
  );
}

export function StudentAnalyticsPage() {
  const { authUser } = useAuth();
  const { data: assignments = [] } = useStudentAssignments(authUser?.uid);
  const { data: submissions = [] } = useStudentSubmissions(authUser?.uid);
  const analytics = useAnalytics(assignments, submissions);

  const progress = useMemo(() => {
    const approvedAssignmentIds = new Set(submissions.filter((item) => item.status === 'approved').map((item) => item.assignmentId));
    const submittedAssignmentIds = new Set(submissions.map((item) => item.assignmentId));

    const totalAssignedAyahs = assignments.reduce(
      (total, assignment) => total + (assignment.quranScope.ayahEnd - assignment.quranScope.ayahStart + 1),
      0
    );
    const memorizedAyahs = assignments
      .filter((assignment) => approvedAssignmentIds.has(assignment.id))
      .reduce((total, assignment) => total + (assignment.quranScope.ayahEnd - assignment.quranScope.ayahStart + 1), 0);
    const remainingAyahs = Math.max(totalAssignedAyahs - memorizedAyahs, 0);
    const completionPercent = totalAssignedAyahs > 0 ? Math.round((memorizedAyahs / totalAssignedAyahs) * 100) : 0;

    const nextHomework = assignments
      .filter((assignment) => !approvedAssignmentIds.has(assignment.id))
      .sort((a, b) => {
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        return aDate - bDate;
      })[0];

    return {
      totalAssignedAyahs,
      memorizedAyahs,
      remainingAyahs,
      completionPercent,
      pendingHomeworkCount: Math.max(assignments.length - approvedAssignmentIds.size, 0),
      submittedHomeworkCount: submittedAssignmentIds.size,
      nextHomework
    };
  }, [assignments, submissions]);

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 gap-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Memorized ayahs</p>
          <p className="text-2xl font-semibold text-brand-900">{progress.memorizedAyahs}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Remaining ayahs</p>
          <p className="text-2xl font-semibold text-brand-900">{progress.remainingAyahs}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Overall completion</p>
          <p className="text-2xl font-semibold text-brand-900">{progress.completionPercent}%</p>
          <p className="text-xs text-slate-500">{progress.memorizedAyahs} of {progress.totalAssignedAyahs} ayahs</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Current wird streak</p>
          <p className="text-2xl font-semibold text-brand-900">{analytics.currentStreak} days</p>
          <p className="text-xs text-slate-500">Best: {analytics.bestStreak} days</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold">Homework status</h3>
        <p className="mt-1 text-xs text-slate-500">
          Submitted: {progress.submittedHomeworkCount} • Pending approval: {progress.pendingHomeworkCount}
        </p>
        {progress.nextHomework ? (
          <div className="mt-3 rounded-xl border border-slate-100 p-3">
            <p className="text-sm font-medium">Next homework</p>
            <p className="text-sm text-slate-700">
              {surahByNumber(progress.nextHomework.quranScope.surahNumber)?.nameEn} - from ayah{' '}
              {progress.nextHomework.quranScope.ayahStart} to {progress.nextHomework.quranScope.ayahEnd}
            </p>
            <p className="text-xs capitalize text-slate-500">Type: {progress.nextHomework.type}</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-emerald-700">All assigned homework has been approved.</p>
        )}
      </section>

      <ChartCard title="Memorization Ayahs Completed per Week">
        <ResponsiveContainer>
          <BarChart data={analytics.memorizationWeekly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="ayahs" fill="#188f6f" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Cumulative Memorization">
        <ResponsiveContainer>
          <LineChart data={analytics.cumulativeMemorization}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="cumulative" stroke="#0f766e" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Completion Rate by Type">
        <ResponsiveContainer>
          <BarChart data={analytics.completionRate}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="rate" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="On-Time vs Late">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={analytics.onTimeVsLate} dataKey="value" nameKey="name" outerRadius={80}>
              {analytics.onTimeVsLate.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
