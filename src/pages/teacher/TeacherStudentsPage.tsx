import { FormEvent, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { EmptyState } from '@/components/common/EmptyState';
import { QuranScopeFields } from '@/components/common/QuranScopeFields';
import { useAuth } from '@/contexts/AuthContext';
import { useClassMembers, useTeacherClasses } from '@/hooks/useData';
import { createAssignment, updateClassMemberDetails } from '@/lib/db';
import { AssignmentType, StudentAgeGroup, StudentLevel } from '@/types';
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

const levelOptions: Array<{ value: StudentLevel; label: string }> = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
];

const ageGroupOptions: Array<{ value: StudentAgeGroup; label: string }> = [
  { value: 'kids', label: 'Kids' },
  { value: 'teens', label: 'Teens' },
  { value: 'adults', label: 'Adults' }
];

function labelLevel(level?: StudentLevel) {
  return levelOptions.find((item) => item.value === level)?.label ?? 'Unassigned level';
}

function labelAgeGroup(ageGroup?: StudentAgeGroup) {
  return ageGroupOptions.find((item) => item.value === ageGroup)?.label ?? 'Unassigned age group';
}

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
  const [levelFilter, setLevelFilter] = useState<'all' | StudentLevel>('all');
  const [ageFilter, setAgeFilter] = useState<'all' | StudentAgeGroup>('all');
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null);

  const students = useMemo(() => members.filter((item) => item.roleInClass === 'student'), [members]);

  const filteredStudents = useMemo(
    () =>
      students.filter(
        (student) => (levelFilter === 'all' || student.level === levelFilter) && (ageFilter === 'all' || student.ageGroup === ageFilter)
      ),
    [students, levelFilter, ageFilter]
  );

  const groupedStudents = useMemo(() => {
    return filteredStudents.reduce<Record<string, typeof filteredStudents>>((acc, student) => {
      const level = labelLevel(student.level);
      const ageGroup = labelAgeGroup(student.ageGroup);
      const groupKey = `${level} / ${ageGroup}`;
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(student);
      return acc;
    }, {});
  }, [filteredStudents]);

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

  async function handleStudentGroupUpdate(studentId: string, field: 'level' | 'ageGroup', value: string) {
    if (!activeClassId) return;
    const current = students.find((student) => student.uid === studentId);
    if (!current) return;

    const nextLevel = field === 'level' ? ((value || undefined) as StudentLevel | undefined) : current.level;
    const nextAgeGroup = field === 'ageGroup' ? ((value || undefined) as StudentAgeGroup | undefined) : current.ageGroup;

    try {
      setSavingStudentId(studentId);
      await updateClassMemberDetails(activeClassId, studentId, { level: nextLevel, ageGroup: nextAgeGroup });
      pushToast('Student grouping updated', 'success');
    } catch (error) {
      pushToast((error as Error).message, 'error');
    } finally {
      setSavingStudentId(null);
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
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-700">Filter by level</span>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as typeof levelFilter)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">All levels</option>
              {levelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-700">Filter by age group</span>
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value as typeof ageFilter)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">All age groups</option>
              {ageGroupOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 space-y-2">
          {Object.entries(groupedStudents).map(([group, groupedItems]) => (
            <div key={group} className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs font-semibold text-slate-500">
                {group} ({groupedItems.length})
              </p>
              <div className="mt-2 space-y-2">
                {groupedItems.map((student) => (
                  <article key={student.uid} className="rounded-lg border border-slate-200 p-2">
                    <p className="text-sm font-medium">{student.displayName || student.uid}</p>
                    <p className="text-xs text-slate-500">ID: {student.uid}</p>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <select
                        value={student.level ?? ''}
                        disabled={savingStudentId === student.uid}
                        onChange={(e) => handleStudentGroupUpdate(student.uid, 'level', e.target.value)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                      >
                        <option value="">Unassigned level</option>
                        {levelOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={student.ageGroup ?? ''}
                        disabled={savingStudentId === student.uid}
                        onChange={(e) => handleStudentGroupUpdate(student.uid, 'ageGroup', e.target.value)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                      >
                        <option value="">Unassigned age group</option>
                        {ageGroupOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
          {students.length === 0 ? <p className="text-sm text-slate-500">No students in this class.</p> : null}
          {students.length > 0 && filteredStudents.length === 0 ? (
            <p className="text-sm text-slate-500">No students match current filters.</p>
          ) : null}
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
                  {student.displayName || student.uid} ({labelLevel(student.level)} / {labelAgeGroup(student.ageGroup)})
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
