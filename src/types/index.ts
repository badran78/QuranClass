import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'student' | 'teacher';
export type AssignmentType = 'memorization' | 'wird' | 'both';
export type SubmissionStatus = 'submitted' | 'approved' | 'revision_requested';
export type JoinRequestStatus = 'pending' | 'accepted' | 'rejected';
export type StudentLevel = 'beginner' | 'intermediate' | 'advanced';
export type StudentAgeGroup = 'kids' | 'teens' | 'adults';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  language: 'en' | 'ar';
  createdAt?: Timestamp;
}

export interface SchoolClass {
  id: string;
  teacherId: string;
  name: string;
  description?: string;
  invitationCode: string;
  createdAt?: Timestamp;
}

export interface ClassMember {
  uid: string;
  roleInClass: 'student';
  status: 'active';
  joinedAt?: Timestamp;
  displayName?: string;
  level?: StudentLevel;
  ageGroup?: StudentAgeGroup;
}

export interface JoinRequest {
  id: string;
  classId: string;
  teacherId: string;
  studentId: string;
  studentName: string;
  status: JoinRequestStatus;
  createdAt?: Timestamp;
  decidedAt?: Timestamp;
}

export interface QuranScope {
  scopeMode: 'surah_ayah';
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
}

export interface Assignment {
  id: string;
  classId: string;
  teacherId: string;
  studentId: string;
  type: AssignmentType;
  quranScope: QuranScope;
  amount?: {
    pagesPerDay?: number;
    notes?: string;
  };
  dueDate?: string;
  recurrence?: string;
  createdAt?: Timestamp;
}

export interface Submission {
  id: string;
  assignmentId: string;
  classId: string;
  studentId: string;
  teacherId: string;
  createdAt?: Timestamp;
  notes?: string;
  content: string;
  status: SubmissionStatus;
  feedback?: string;
  decidedAt?: Timestamp;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'join_request' | 'join_request_decision' | 'new_assignment' | 'submission_reviewed' | 'assignment_completed';
  title: string;
  body: string;
  classId?: string;
  createdAt?: Timestamp;
  readAt?: Timestamp;
}

export interface SurahMeta {
  number: number;
  nameAr: string;
  nameEn: string;
  ayahCount: number;
}
