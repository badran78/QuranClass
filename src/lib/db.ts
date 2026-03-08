import {
  addDoc,
  collection,
  collectionGroup,
  deleteField,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  AppUser,
  Assignment,
  AssignmentType,
  StudentAgeGroup,
  ClassMember,
  JoinRequest,
  NotificationItem,
  SchoolClass,
  StudentLevel,
  Submission,
  SubmissionStatus,
  UserRole
} from '@/types';
import { randomInvitationCode } from '@/lib/utils';
import { surahByNumber } from '@/constants/quran';

export async function createUserProfile(data: {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  language?: 'en' | 'ar';
}) {
  await setDoc(doc(db, 'users', data.uid), {
    ...data,
    language: data.language ?? 'en',
    createdAt: serverTimestamp()
  });
}

export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as Omit<AppUser, 'uid'>) };
}

export async function updateUserProfile(uid: string, data: Partial<Pick<AppUser, 'displayName' | 'language'>>) {
  await updateDoc(doc(db, 'users', uid), data);
}

export async function createClass(teacherId: string, name: string, description?: string) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const invitationCode = `${randomInvitationCode(4)}${randomInvitationCode(4)}`;
    const classRef = doc(collection(db, 'classes'));
    const codeRef = doc(db, 'invitationCodes', invitationCode);

    try {
      await runTransaction(db, async (transaction) => {
        const codeSnap = await transaction.get(codeRef);
        if (codeSnap.exists()) {
          throw new Error('INVITATION_CODE_COLLISION');
        }

        transaction.set(classRef, {
          teacherId,
          name,
          description: description ?? '',
          invitationCode,
          createdAt: serverTimestamp()
        });

        transaction.set(codeRef, {
          code: invitationCode,
          classId: classRef.id,
          teacherId,
          className: name,
          createdAt: serverTimestamp()
        });
      });

      return classRef.id;
    } catch (error) {
      if (error instanceof Error && error.message === 'INVITATION_CODE_COLLISION') {
        continue;
      }
      throw error;
    }
  }

  throw new Error('Failed to create class. Please try again.');
}

export async function requestJoinByInvitationCode(studentId: string, studentName: string, invitationCode: string) {
  const normalizedCode = invitationCode.trim().toUpperCase();
  const inviteSnap = await getDoc(doc(db, 'invitationCodes', normalizedCode));
  if (!inviteSnap.exists()) throw new Error('Invalid invitation code');
  const inviteData = inviteSnap.data() as {
    classId: string;
    teacherId: string;
    className: string;
  };
  const classId = inviteData.classId;
  const memberSnap = await getDoc(doc(db, `classes/${classId}/members/${studentId}`));
  if (memberSnap.exists()) {
    throw new Error('You are already in this class');
  }

  const existing = await getDocs(
    query(
      collection(db, `classes/${classId}/joinRequests`),
      where('studentId', '==', studentId),
      where('status', '==', 'pending'),
      limit(1)
    )
  );

  if (!existing.empty) throw new Error('You already have a pending request for this class');

  await addDoc(collection(db, `classes/${classId}/joinRequests`), {
    teacherId: inviteData.teacherId,
    studentId,
    studentName,
    status: 'pending',
    createdAt: serverTimestamp()
  });

  await createNotification({
    userId: inviteData.teacherId,
    type: 'join_request',
    title: 'New join request',
    body: `${studentName} requested to join ${inviteData.className}`,
    classId
  });
}

export async function decideJoinRequest(classId: string, requestId: string, decision: 'accepted' | 'rejected') {
  const requestRef = doc(db, `classes/${classId}/joinRequests/${requestId}`);

  await runTransaction(db, async (transaction) => {
    const requestSnap = await transaction.get(requestRef);
    if (!requestSnap.exists()) throw new Error('Request not found');

    const requestData = requestSnap.data() as Omit<JoinRequest, 'id' | 'classId'>;
    if (requestData.status !== 'pending') throw new Error('Request already processed');

    transaction.update(requestRef, {
      status: decision,
      decidedAt: serverTimestamp()
    });

    if (decision === 'accepted') {
      const memberRef = doc(db, `classes/${classId}/members/${requestData.studentId}`);
      transaction.set(memberRef, {
        uid: requestData.studentId,
        roleInClass: 'student',
        status: 'active',
        joinedAt: serverTimestamp(),
        displayName: requestData.studentName
      });
    }
  });

  const reqSnap = await getDoc(requestRef);
  const reqData = reqSnap.data() as Omit<JoinRequest, 'id' | 'classId'>;
  await createNotification({
    userId: reqData.studentId,
    type: 'join_request_decision',
    title: `Join request ${decision}`,
    body: `Your request was ${decision}`,
    classId
  });
}

export async function createAssignment(input: {
  classId: string;
  studentId: string;
  teacherId: string;
  type: AssignmentType;
  quranScope: Assignment['quranScope'];
  amount?: Assignment['amount'];
  dueDate?: string;
  recurrence?: string;
}) {
  await addDoc(collection(db, 'assignments'), {
    ...input,
    createdAt: serverTimestamp()
  });

  await createNotification({
    userId: input.studentId,
    type: 'new_assignment',
    title: 'New assignment',
    body: 'You have a new Quran assignment',
    classId: input.classId
  });
}

export async function submitAssignment(input: {
  assignmentId: string;
  classId: string;
  studentId: string;
  teacherId: string;
  notes?: string;
  content: string;
}) {
  await addDoc(collection(db, 'submissions'), {
    ...input,
    status: 'submitted',
    feedback: '',
    createdAt: serverTimestamp()
  });

  const assignmentSnap = await getDoc(doc(db, 'assignments', input.assignmentId));
  if (!assignmentSnap.exists()) return;

  const assignment = assignmentSnap.data() as Omit<Assignment, 'id'>;
  const surah = surahByNumber(assignment.quranScope.surahNumber);
  await createNotification({
    userId: input.teacherId,
    type: 'assignment_completed',
    title: 'Student submitted homework',
    body: `${surah?.nameEn ?? `Surah ${assignment.quranScope.surahNumber}`}, Ayah ${assignment.quranScope.ayahStart}-${assignment.quranScope.ayahEnd}`,
    classId: input.classId
  });
}

export async function reviewSubmission(submissionId: string, status: Exclude<SubmissionStatus, 'submitted'>, feedback?: string) {
  const submissionRef = doc(db, 'submissions', submissionId);
  const snapshot = await getDoc(submissionRef);
  if (!snapshot.exists()) throw new Error('Submission not found');
  const submission = snapshot.data() as Omit<Submission, 'id'>;

  await updateDoc(submissionRef, {
    status,
    feedback: feedback ?? '',
    decidedAt: serverTimestamp()
  });

  await createNotification({
    userId: submission.studentId,
    type: 'submission_reviewed',
    title: status === 'approved' ? 'Submission approved' : 'Revision requested',
    body: feedback || 'Your submission has been reviewed',
    classId: submission.classId
  });
}

export async function markNotificationRead(notificationId: string) {
  await updateDoc(doc(db, 'notifications', notificationId), { readAt: serverTimestamp() });
}

export async function createNotification(input: {
  userId: string;
  type: NotificationItem['type'];
  title: string;
  body: string;
  classId?: string;
}) {
  await addDoc(collection(db, 'notifications'), {
    ...input,
    createdAt: serverTimestamp()
  });
}

export async function updateClassMemberDetails(
  classId: string,
  studentId: string,
  input: { level?: StudentLevel; ageGroup?: StudentAgeGroup }
) {
  const memberRef = doc(db, `classes/${classId}/members/${studentId}`);
  await updateDoc(memberRef, {
    level: input.level ?? deleteField(),
    ageGroup: input.ageGroup ?? deleteField()
  });
}

export async function deleteClass(classId: string) {
  await deleteDoc(doc(db, 'classes', classId));
}

export function watchTeacherClasses(teacherId: string, cb: (items: SchoolClass[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'classes'), where('teacherId', '==', teacherId), orderBy('createdAt', 'desc')),
    (snapshot) => {
      cb(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SchoolClass, 'id'>) })));
    }
  );
}

export function watchStudentClasses(studentId: string, cb: (items: SchoolClass[]) => void): Unsubscribe {
  const acceptedJoinRequestsQuery = query(
    collectionGroup(db, 'joinRequests'),
    where('studentId', '==', studentId),
    where('status', '==', 'accepted'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(acceptedJoinRequestsQuery, async (snapshot) => {
    const classIds = Array.from(new Set(snapshot.docs.map((d) => d.ref.parent.parent?.id).filter(Boolean))) as string[];
    const classDocs = await Promise.all(classIds.map((classId) => getDoc(doc(db, 'classes', classId))));
    const classes = classDocs
      .filter((d) => d.exists())
      .map((d) => ({ id: d.id, ...(d.data() as Omit<SchoolClass, 'id'>) }));
    cb(classes);
  });
}

export function watchClassJoinRequests(classId: string, cb: (items: JoinRequest[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, `classes/${classId}/joinRequests`), orderBy('createdAt', 'desc')),
    (snapshot) => {
      cb(snapshot.docs.map((d) => ({ id: d.id, classId, ...(d.data() as Omit<JoinRequest, 'id' | 'classId'>) })));
    }
  );
}

export function watchClassMembers(classId: string, cb: (items: ClassMember[]) => void): Unsubscribe {
  return onSnapshot(collection(db, `classes/${classId}/members`), (snapshot) => {
    cb(snapshot.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<ClassMember, 'uid'>) })));
  });
}

export function watchStudentAssignments(studentId: string, cb: (items: Assignment[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'assignments'), where('studentId', '==', studentId), orderBy('createdAt', 'desc')),
    (snapshot) => cb(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Assignment, 'id'>) })))
  );
}

export function watchTeacherAssignments(teacherId: string, cb: (items: Assignment[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'assignments'), where('teacherId', '==', teacherId), orderBy('createdAt', 'desc')),
    (snapshot) => cb(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Assignment, 'id'>) })))
  );
}

export function watchSubmissionsByTeacher(teacherId: string, cb: (items: Submission[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'submissions'), where('teacherId', '==', teacherId), orderBy('createdAt', 'desc')),
    (snapshot) => cb(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Submission, 'id'>) })))
  );
}

export function watchSubmissionsByStudent(studentId: string, cb: (items: Submission[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'submissions'), where('studentId', '==', studentId), orderBy('createdAt', 'desc')),
    (snapshot) => cb(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Submission, 'id'>) })))
  );
}

export function watchNotifications(userId: string, cb: (items: NotificationItem[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'notifications'), where('userId', '==', userId), orderBy('createdAt', 'desc')),
    (snapshot) => cb(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<NotificationItem, 'id'>) })))
  );
}
