import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { SignInPage } from '@/pages/auth/SignInPage';
import { SignUpPage } from '@/pages/auth/SignUpPage';
import { CompleteProfilePage } from '@/pages/auth/CompleteProfilePage';
import { RoleHomeRedirect } from '@/pages/common/RoleHomeRedirect';
import { ProfilePage } from '@/pages/common/ProfilePage';
import { StudentClassesPage } from '@/pages/student/StudentClassesPage';
import { StudentAssignmentsPage } from '@/pages/student/StudentAssignmentsPage';
import { StudentSubmitPage } from '@/pages/student/StudentSubmitPage';
import { StudentAnalyticsPage } from '@/pages/student/StudentAnalyticsPage';
import { TeacherClassesPage } from '@/pages/teacher/TeacherClassesPage';
import { TeacherStudentsPage } from '@/pages/teacher/TeacherStudentsPage';
import { TeacherReviewPage } from '@/pages/teacher/TeacherReviewPage';
import { TeacherAnalyticsPage } from '@/pages/teacher/TeacherAnalyticsPage';

function LanguageSync() {
  const { i18n } = useTranslation();
  const { profile } = useAuth();

  useEffect(() => {
    const language = profile?.language ?? 'en';
    void i18n.changeLanguage(language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [profile?.language, i18n]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageSync />
      <Routes>
        <Route path="/" element={<RoleHomeRedirect />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route
          path="/complete-profile"
          element={
            <ProtectedRoute requireProfile={false}>
              <CompleteProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route
            path="/student/classes"
            element={
              <ProtectedRoute role="student">
                <StudentClassesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/assignments"
            element={
              <ProtectedRoute role="student">
                <StudentAssignmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/submit"
            element={
              <ProtectedRoute role="student">
                <StudentSubmitPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/status"
            element={
              <ProtectedRoute role="student">
                <StudentAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute role="student">
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/classes"
            element={
              <ProtectedRoute role="teacher">
                <TeacherClassesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/students"
            element={
              <ProtectedRoute role="teacher">
                <TeacherStudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/review"
            element={
              <ProtectedRoute role="teacher">
                <TeacherReviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/analytics"
            element={
              <ProtectedRoute role="teacher">
                <TeacherAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/profile"
            element={
              <ProtectedRoute role="teacher">
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
