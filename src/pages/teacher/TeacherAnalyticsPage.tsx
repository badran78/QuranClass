import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useClassMembers, useTeacherAssignments, useTeacherClasses, useTeacherSubmissions } from '@/hooks/useData';
import { useAnalytics } from '@/hooks/useAnalytics';

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 h-56">{children}</div>
    </section>
  );
}

export function TeacherAnalyticsPage() {
  const { authUser } = useAuth();
  const { data: classes = [] } = useTeacherClasses(authUser?.uid);
  const { data: assignments = [] } = useTeacherAssignments(authUser?.uid);
  const { data: submissions = [] } = useTeacherSubmissions(authUser?.uid);

  const [classId, setClassId] = useState('');
  const activeClassId = classId || classes[0]?.id;
  const { data: members = [] } = useClassMembers(activeClassId);
  const [studentId, setStudentId] = useState('');

  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => (!activeClassId || item.classId === activeClassId) && (!studentId || item.studentId === studentId));
  }, [assignments, activeClassId, studentId]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => (!activeClassId || item.classId === activeClassId) && (!studentId || item.studentId === studentId));
  }, [submissions, activeClassId, studentId]);

  const analytics = useAnalytics(filteredAssignments, filteredSubmissions);

  const classOverview = useMemo(() => {
    if (!activeClassId) return [];
    return members.map((member) => {
      const total = assignments.filter((item) => item.classId === activeClassId && item.studentId === member.uid).length;
      const done = submissions.filter(
        (item) => item.classId === activeClassId && item.studentId === member.uid && item.status === 'approved'
      ).length;
      return {
        student: member.displayName || member.uid.slice(0, 6),
        completion: total > 0 ? Math.round((done / total) * 100) : 0
      };
    });
  }, [activeClassId, assignments, submissions, members]);

  if (classes.length === 0) {
    return <EmptyState title="No analytics yet" description="Create classes and assignments to unlock analytics." />;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Filters</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select value={activeClassId} onChange={(e) => setClassId(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="">All students</option>
            {members.map((member) => (
              <option key={member.uid} value={member.uid}>
                {member.displayName || member.uid}
              </option>
            ))}
          </select>
        </div>
      </section>

      <Block title="Class Completion Overview">
        <ResponsiveContainer>
          <BarChart data={classOverview}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="student" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="completion" fill="#0ea5e9" />
          </BarChart>
        </ResponsiveContainer>
      </Block>

      <Block title="Memorization Progress (Cumulative)">
        <ResponsiveContainer>
          <LineChart data={analytics.cumulativeMemorization}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Line dataKey="cumulative" stroke="#16a34a" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Block>

      <Block title="Completion Rate by Type">
        <ResponsiveContainer>
          <BarChart data={analytics.completionRate}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="rate" fill="#7c3aed" />
          </BarChart>
        </ResponsiveContainer>
      </Block>
    </div>
  );
}
