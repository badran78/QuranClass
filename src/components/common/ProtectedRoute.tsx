import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import { UserRole } from '@/types';

export function ProtectedRoute({
  children,
  role,
  requireProfile = true
}: {
  children: ReactElement;
  role?: UserRole;
  requireProfile?: boolean;
}) {
  const { authUser, profile, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!authUser) return <Navigate to="/signin" replace />;
  if (requireProfile && !profile) return <Navigate to="/complete-profile" replace />;
  if (role && profile?.role !== role) {
    const home = profile?.role === 'teacher' ? '/teacher/classes' : '/student/classes';
    return <Navigate to={home} replace />;
  }

  return children;
}
