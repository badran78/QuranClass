import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export function RoleHomeRedirect() {
  const { authUser, profile, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!authUser) return <Navigate to="/signin" replace />;
  if (!profile) return <Navigate to="/complete-profile" replace />;

  if (profile.role === 'teacher') {
    return <Navigate to="/teacher/classes" replace />;
  }

  return <Navigate to="/student/classes" replace />;
}
