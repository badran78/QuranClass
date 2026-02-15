import { FormEvent, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { EmptyState } from '@/components/common/EmptyState';
import { QuranScopeFields } from '@/components/common/QuranScopeFields';
import { useAuth } from '@/contexts/AuthContext';
import { useClassMembers, useTeacherClasses } from '@/hooks/useData';
import { createAssignment } from '@/lib/db';
import { AssignmentType } from '@/types';
import { useToast } from '@/components/common/ToastProvider';

const schema = z
  .object({
    studentId: z.string().min(1),
    type: z.enum(['memorization', 'wird', 'both']),
    surahNumber: z.number().min(1).max(114),
    ayahStart: z.number().min(1),
    ayahEnd: z.number().min(1),
    pagesPerDay: z.number().min(0).optional(),
    dueDate: z.string().optional(),
    notes: z.string().optional()
  })
  .refine((value) => value.ayahEnd >= value.ayahStart, {
    message: 'Ayah end must be >= ayah start',
    path: ['ayahEnd']
  });

export function TeacherStudentsPage() {
  const { authUser } = useAuth();
  const { data: classes = [] } = useTeacherClasses(authUser?.uid);
  const [classId, setClassId] = useState<string>('');
  const { data: members = [] } = useClassMembers(classId || classes[0]?.id);
  const { pushToast } = useToast();

  const activeClassId = classId || classes[0]?.id;
  const [form, setForm] = useState({
    studentId: '',
    type: 'memorization' as AssignmentType,
    quranScope: { scopeMode: 'surah_ayah' as const, surahNumber: 1, ayahStart: 1, ayahEnd: 7 },
    pagesPerDay: 0,
    dueDate: '',
    notes: ''
  });

  const students = useMemo(() => members.filter((item) => item.roleInClass === 'student'), [members]);

  useEffect(() => {
    setForm((prev) => {
      if (!prev.studentId) return prev;
      if (students.some((student) => student.uid === prev.studentId)) return prev;
      return { ...prev, studentId: '' };
    });
  }, [students]);

  async function handleCreateAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeClassId || !authUser) return;

    const parsed = schema.safeParse({
      studentId: form.studentId,
      type: form.type,
      surahNumber: form.quranScope.surahNumber,
      ayahStart: form.quranScope.ayahStart,
      ayahEnd: form.quranScope.ayahEnd,
      pagesPerDay: form.pagesPerDay || undefined,
      dueDate: form.dueDate || undefined,
      notes: form.notes || undefined
    });

    if (!parsed.success) {
      pushToast(parsed.error.issues[0]?.message ?? 'Invalid assignment', 'error');
      return;
    }

    try {
      await createAssignment({
        classId: activeClassId,
        studentId: parsed.data.studentId,
        teacherId: authUser.uid,
        type: parsed.data.type,
        quranScope: {
          scopeMode: 'surah_ayah',
          surahNumber: parsed.data.surahNumber,
          ayahStart: parsed.data.ayahStart,
          ayahEnd: parsed.data.ayahEnd
        },
        amount: {
          pagesPerDay: parsed.data.pagesPerDay,
          notes: parsed.data.notes
        },
        dueDate: parsed.data.dueDate
      });
      pushToast('Assignment created', 'success');
      setForm((prev) => ({ ...prev, studentId: '', dueDate: '', notes: '', pagesPerDay: 0 }));
    } catch (error) {
      pushToast((error as Error).message, 'error');
    }
  }

  if (classes.length === 0) {
    return <EmptyState title="No classes" description="Create a class first before assigning students." />;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Students</h2>
        <select
          value={activeClassId}
          onChange={(e) => setClassId(e.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
        >
          {classes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <div className="mt-3 space-y-2">
          {students.map((student) => (
            <article key={student.uid} className="rounded-lg border border-slate-100 p-2">
              <p className="text-sm font-medium">{student.displayName || student.uid}</p>
            </article>
          ))}
          {students.length === 0 ? <p className="text-sm text-slate-500">No students in this class.</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold">Create Assignment</h3>
        <form onSubmit={handleCreateAssignment} className="mt-3 space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Student</span>
            <select
              value={form.studentId}
              onChange={(e) => setForm((prev) => ({ ...prev, studentId: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student.uid} value={student.uid}>
                  {student.displayName || student.uid}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Type</span>
            <select
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as AssignmentType }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="memorization">Memorization</option>
              <option value="wird">Wird</option>
              <option value="both">Both</option>
            </select>
          </label>

          <QuranScopeFields value={form.quranScope} onChange={(next) => setForm((prev) => ({ ...prev, quranScope: next }))} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Pages/Day (optional)</span>
              <input
                type="number"
                value={form.pagesPerDay}
                onChange={(e) => setForm((prev) => ({ ...prev, pagesPerDay: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Due Date (optional)</span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Teacher Notes</span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <button type="submit" className="w-full rounded-lg bg-brand-700 px-4 py-2 text-white">
            Assign
          </button>
        </form>
      </section>
    </div>
  );
}
