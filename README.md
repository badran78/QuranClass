# QuranClass

QuranClass is a production-ready, mobile-first web app for small private Quran schools (10-100 users). It supports role-based workflows for teachers and students, structured Quran assignment scopes, unlimited submission revision history, real-time updates, and analytics.

## Stack

- Frontend: React + Vite + TypeScript
- Styling/UI: TailwindCSS + Headless UI + lucide-react
- Backend/Auth/DB: Firebase Authentication + Firestore (real-time listeners)
- Data state: TanStack Query + Firestore `onSnapshot`
- Validation: Zod
- Charts: Recharts
- i18n: i18next (English + Arabic + RTL)

## Features Implemented

- Email/password auth (sign up/sign in)
- Role selection at sign-up (`student` or `teacher`) with user profile in Firestore
- Teacher flows:
  - Create/manage multiple classes
  - Unique invitation code per class
  - Real-time join request queue (accept/reject)
  - Organize students by level (`beginner`, `intermediate`, `advanced`) and age group (`kids`, `teens`, `adults`)
  - Create student-specific assignments (`memorization`, `wird`, `both`) with structured Surah/Ayah range
  - Review student submissions (approve/revision requested) with feedback
  - Teacher analytics per class and per student
- Student flows:
  - Join class by invitation code (request workflow)
  - View assignments grouped by class
  - View detailed homework ranges with Surah name and Ayah start/end
  - Quick submit completion with notes
  - Submission timeline + status updates
  - Personal analytics including memorized ayahs, remaining ayahs, and completion %
- In-app real-time notification center
- Teacher receives notifications when students submit assignment completion
- Mobile-first bottom tab navigation with role-based tabs
- i18n + persisted language preference (`en` / `ar`) and RTL support

## Folder Structure

- `src/components`
- `src/pages`
- `src/lib`
- `src/hooks`
- `src/types`
- `src/i18n`
- `src/constants`
- `firestore.rules`
- `firestore.indexes.json`
- `scripts/seed.ts`

## Firestore Data Model

- `users/{uid}`
  - `role`, `displayName`, `email`, `language`, `createdAt`
- `classes/{classId}`
  - `teacherId`, `name`, `description`, `invitationCode`, `createdAt`
- `classes/{classId}/members/{uid}`
  - `uid`, `roleInClass`, `status`, `displayName`, `joinedAt`, `level?`, `ageGroup?`
- `classes/{classId}/joinRequests/{requestId}`
  - `teacherId`, `studentId`, `studentName`, `status`, `createdAt`, `decidedAt`
- `assignments/{assignmentId}` (top-level)
  - `classId`, `teacherId`, `studentId`, `type`, `quranScope`, `amount`, `dueDate`, `createdAt`
- `submissions/{submissionId}` (top-level)
  - `assignmentId`, `classId`, `studentId`, `teacherId`, `content`, `notes`, `status`, `feedback`, `createdAt`, `decidedAt`
- `notifications/{notificationId}`
  - `userId`, `type`, `title`, `body`, `classId`, `createdAt`, `readAt`
  - `type` includes `join_request`, `join_request_decision`, `new_assignment`, `submission_reviewed`, `assignment_completed`
- `quran/meta` (optional seed)
  - `surahs[]`

## Why Assignments Are Top-Level

Assignments are stored in top-level `assignments` instead of class subcollections.

This optimizes the key student query: “all my assignments across multiple classes” with one indexed query (`where studentId == uid`).
Teacher class/student filtering is also supported via composite indexes (`classId + studentId + createdAt`).

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and fill values from Firebase project settings:

```bash
cp .env.example .env
```

Required env vars:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

3. Run locally:

```bash
npm run dev
```

4. Production build:

```bash
npm run build
npm run preview
```

## iPhone + App Store Packaging (Capacitor)

This project includes Capacitor so it can run as a native iOS app and be submitted to the App Store.

1. Install dependencies:

```bash
npm install
```

2. Build web assets and sync Capacitor:

```bash
npm run cap:sync
```

3. Generate/open iOS project (on macOS with Xcode installed):

```bash
npm run cap:ios
```

4. In Xcode:
   - Set signing team + bundle identifier.
   - Add app icons and launch screen.
   - Configure version/build number.
   - Archive and submit with Organizer to App Store Connect.

Capacitor configuration is in `capacitor.config.ts`.

## Firebase Project Setup

1. Create a Firebase project in Firebase Console.
2. Enable Authentication -> Sign-in method -> Email/Password.
3. Create Firestore database (production mode).
4. Copy web app config values into `.env`.
5. Deploy rules and indexes:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

6. (Optional) Seed Quran metadata to Firestore:

```bash
npm run seed:quran
```

## Hosting (Optional)

After building:

```bash
npm run build
firebase deploy --only hosting
```

`firebase.json` is included with SPA rewrites to `index.html`.

## Security Rules

Rules are defined in `firestore.rules` and enforce:

- Users can only read/write their own profile.
- Teachers can create/manage only their own classes.
- Students can request joins and read only their own join requests.
- Teachers can approve/reject join requests for their classes.
- Assignments are visible only to assigned student and class teacher(s).
- Students can create only their own submissions.
- Teachers can review only their submission queue.
- Notifications are readable only by owner (`userId == auth.uid`).

## Firestore Indexes

Composite/special indexes are included in `firestore.indexes.json` for:

- Collection group join requests by teacher + status + createdAt
- Student assignments across classes
- Teacher assignment filtering
- Teacher submission review queue
- Student submission history
- User notifications feed
- Member collection group lookup by `uid`

## Architecture Notes

- Real-time strategy:
  - Firestore `onSnapshot` listeners are used for classes, join requests, assignments, submissions, notifications.
  - TanStack Query cache is updated from listeners to keep UI reactive and avoid extra fetch complexity.
- Unlimited revisions:
  - Each student submit action creates a new `submissions` document.
  - Teacher review mutates submission status (`approved` or `revision_requested`) with feedback.
  - Student timeline is rendered from submission history by assignment.
- Quran structure:
  - Full local Surah metadata (1-114 with ayah counts) is bundled in app for typed selector UX.
  - Optional Firestore seed (`quran/meta`) keeps backend schema ready for expansion.
- Analytics:
  - Current implementation computes metrics client-side from assignment + submission streams:
    - Ayahs/week and cumulative memorization
    - Wird consistency and streak
    - Completion rates by type
    - On-time vs late (when due date exists)

## Notes

- This repo is optimized for small school scale and can be extended with Cloud Functions for stronger server-side workflow enforcement and background analytics materialization.
- Recurrence schema field is present and ready, but recurrence scheduling engine is not enforced server-side in this MVP.
