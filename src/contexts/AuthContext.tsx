import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile, getUserProfile } from '@/lib/db';
import { AppUser, UserRole } from '@/types';

interface AuthContextValue {
  authUser: User | null;
  profile: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: { email: string; password: string; displayName: string; role: UserRole }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const PENDING_SIGNUP_KEY = 'quranclass_pending_signup';
const PROFILE_CACHE_KEY = 'quranclass_profile_cache';

interface PendingSignup {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(user: User | null) {
    if (!user) {
      setProfile(null);
      return;
    }
    try {
      let data = await getUserProfile(user.uid);

      if (!data) {
        const pending = safeParse<PendingSignup>(localStorage.getItem(PENDING_SIGNUP_KEY));
        if (pending?.uid === user.uid) {
          await createUserProfile({
            uid: pending.uid,
            email: pending.email,
            displayName: pending.displayName,
            role: pending.role,
            language: 'en'
          });
          localStorage.removeItem(PENDING_SIGNUP_KEY);
          data = await getUserProfile(user.uid);
        }
      }

      if (!data) {
        const cached = safeParse<AppUser>(localStorage.getItem(PROFILE_CACHE_KEY));
        if (cached?.uid === user.uid) {
          data = cached;
        }
      }

      if (data) {
        localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
      }

      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
      const cached = safeParse<AppUser>(localStorage.getItem(PROFILE_CACHE_KEY));
      if (cached?.uid === user.uid) {
        setProfile(cached);
        return;
      }
      setProfile(null);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setAuthUser(user);
        await loadProfile(user);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authUser,
      profile,
      loading,
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      signUp: async ({ email, password, displayName, role }) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        localStorage.setItem(
          PENDING_SIGNUP_KEY,
          JSON.stringify({
            uid: cred.user.uid,
            email,
            displayName,
            role
          } satisfies PendingSignup)
        );
        await createUserProfile({
          uid: cred.user.uid,
          email,
          displayName,
          role,
          language: 'en'
        });
        localStorage.removeItem(PENDING_SIGNUP_KEY);
        await loadProfile(cred.user);
      },
      logout: async () => {
        await signOut(auth);
      },
      refreshProfile: async () => {
        await loadProfile(auth.currentUser);
      }
    }),
    [authUser, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
