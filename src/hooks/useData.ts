import { useMemo } from 'react';
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';
import {
  watchClassJoinRequests,
  watchClassMembers,
  watchNotifications,
  watchStudentAssignments,
  watchStudentClasses,
  watchSubmissionsByStudent,
  watchSubmissionsByTeacher,
  watchTeacherAssignments,
  watchTeacherClasses
} from '@/lib/db';
import { Assignment, ClassMember, JoinRequest, NotificationItem, SchoolClass, Submission } from '@/types';

export function useTeacherClasses(uid?: string) {
  const key = useMemo(() => ['teacher-classes', uid], [uid]);
  return useRealtimeCollection<SchoolClass>(key, (cb) => (uid ? watchTeacherClasses(uid, cb) : () => undefined), []);
}

export function useStudentClasses(uid?: string) {
  const key = useMemo(() => ['student-classes', uid], [uid]);
  return useRealtimeCollection<SchoolClass>(key, (cb) => (uid ? watchStudentClasses(uid, cb) : () => undefined), []);
}

export function useJoinRequests(classId?: string) {
  const key = useMemo(() => ['join-requests', classId], [classId]);
  return useRealtimeCollection<JoinRequest>(key, (cb) => (classId ? watchClassJoinRequests(classId, cb) : () => undefined), []);
}

export function useClassMembers(classId?: string) {
  const key = useMemo(() => ['class-members', classId], [classId]);
  return useRealtimeCollection<ClassMember>(key, (cb) => (classId ? watchClassMembers(classId, cb) : () => undefined), []);
}

export function useStudentAssignments(uid?: string) {
  const key = useMemo(() => ['student-assignments', uid], [uid]);
  return useRealtimeCollection<Assignment>(key, (cb) => (uid ? watchStudentAssignments(uid, cb) : () => undefined), []);
}

export function useTeacherAssignments(uid?: string) {
  const key = useMemo(() => ['teacher-assignments', uid], [uid]);
  return useRealtimeCollection<Assignment>(key, (cb) => (uid ? watchTeacherAssignments(uid, cb) : () => undefined), []);
}

export function useStudentSubmissions(uid?: string) {
  const key = useMemo(() => ['student-submissions', uid], [uid]);
  return useRealtimeCollection<Submission>(key, (cb) => (uid ? watchSubmissionsByStudent(uid, cb) : () => undefined), []);
}

export function useTeacherSubmissions(uid?: string) {
  const key = useMemo(() => ['teacher-submissions', uid], [uid]);
  return useRealtimeCollection<Submission>(key, (cb) => (uid ? watchSubmissionsByTeacher(uid, cb) : () => undefined), []);
}

export function useNotifications(uid?: string) {
  const key = useMemo(() => ['notifications', uid], [uid]);
  return useRealtimeCollection<NotificationItem>(key, (cb) => (uid ? watchNotifications(uid, cb) : () => undefined), []);
}
