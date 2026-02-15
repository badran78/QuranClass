import { differenceInCalendarDays, startOfWeek } from 'date-fns';
import { Assignment, Submission } from '@/types';

export function useAnalytics(assignments: Assignment[], submissions: Submission[]) {
  const byWeek: Record<string, number> = {};
  const pagesByDay: Record<string, number> = {};
  const completionByType: Record<string, { done: number; total: number }> = {
    memorization: { done: 0, total: 0 },
    wird: { done: 0, total: 0 },
    both: { done: 0, total: 0 }
  };

  let onTime = 0;
  let late = 0;

  assignments.forEach((assignment) => {
    completionByType[assignment.type].total += 1;
    const assignmentSubmissions = submissions
      .filter((s) => s.assignmentId === assignment.id && s.status === 'approved')
      .sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0));

    const approved = assignmentSubmissions[0];
    if (approved) {
      completionByType[assignment.type].done += 1;

      const date = approved.createdAt ? new Date(approved.createdAt.seconds * 1000) : new Date();
      const bucket = startOfWeek(date, { weekStartsOn: 1 }).toISOString().slice(0, 10);
      const ayahs = assignment.quranScope.ayahEnd - assignment.quranScope.ayahStart + 1;
      byWeek[bucket] = (byWeek[bucket] ?? 0) + ayahs;

      const dayKey = date.toISOString().slice(0, 10);
      const pages = assignment.amount?.pagesPerDay ?? Math.max(1, Math.round(ayahs / 5));
      pagesByDay[dayKey] = (pagesByDay[dayKey] ?? 0) + pages;

      if (assignment.dueDate) {
        const due = new Date(assignment.dueDate);
        if (differenceInCalendarDays(date, due) <= 0) onTime += 1;
        else late += 1;
      }
    }
  });

  const memorizationWeekly = Object.entries(byWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, ayahs]) => ({ week, ayahs }));

  const cumulativeMemorization = memorizationWeekly.map((item, index) => ({
    week: item.week,
    cumulative: memorizationWeekly.slice(0, index + 1).reduce((acc, x) => acc + x.ayahs, 0)
  }));

  const wirdConsistency = Object.entries(pagesByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, pages]) => ({ date, pages }));

  let streak = 0;
  let bestStreak = 0;
  let cursor = new Date();

  while (pagesByDay[cursor.toISOString().slice(0, 10)] && streak < 365) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const sortedDays = Object.keys(pagesByDay).sort();
  let current = 0;
  for (let i = 0; i < sortedDays.length; i += 1) {
    if (i === 0) {
      current = 1;
    } else {
      const prev = new Date(sortedDays[i - 1]);
      const now = new Date(sortedDays[i]);
      current = differenceInCalendarDays(now, prev) === 1 ? current + 1 : 1;
    }
    bestStreak = Math.max(bestStreak, current);
  }

  const completionRate = Object.entries(completionByType).map(([type, value]) => ({
    type,
    rate: value.total > 0 ? Math.round((value.done / value.total) * 100) : 0
  }));

  const onTimeVsLate = [
    { name: 'On time', value: onTime },
    { name: 'Late', value: late }
  ];

  return {
    memorizationWeekly,
    cumulativeMemorization,
    wirdConsistency,
    completionRate,
    onTimeVsLate,
    currentStreak: streak,
    bestStreak
  };
}
