"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import type { CurrentUserSession } from "@/lib/types/auth";

type AuthContextValue = {
  firebaseUserId: string | null;
  idToken: string | null;
  profile: CurrentUserSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  createInitialAdmin: (input: {
    email: string;
    password: string;
    displayName: string;
    bootstrapKey: string;
  }) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchMyProfile(token: string): Promise<CurrentUserSession | null> {
  const response = await fetch("/api/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as CurrentUserSession;
}

async function syncSessionCookie(token: string) {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ idToken: token })
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Nao foi possivel sincronizar a sessao.");
  }
}

async function clearSessionCookie() {
  await fetch("/api/auth/session", {
    method: "DELETE"
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUserId, setFirebaseUserId] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<CurrentUserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getClientAuth();
    return onAuthStateChanged(auth, async (user) => {
      try {
        setFirebaseUserId(user?.uid ?? null);

        if (!user) {
          setIdToken(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        const token = await user.getIdToken();
        setIdToken(token);
        await syncSessionCookie(token);
        setProfile(await fetchMyProfile(token));
      } catch {
        setIdToken(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  async function refreshProfile() {
    const auth = getClientAuth();
    const user = auth.currentUser;

    if (!user) {
      setProfile(null);
      setIdToken(null);
      return;
    }

    const token = await user.getIdToken(true);
    setIdToken(token);
    await syncSessionCookie(token);
    setProfile(await fetchMyProfile(token));
  }

  async function signIn(email: string, password: string) {
    const auth = getClientAuth();
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signOut() {
    const auth = getClientAuth();
    await clearSessionCookie().catch(() => null);
    await firebaseSignOut(auth);
  }

  async function createInitialAdmin(input: {
    email: string;
    password: string;
    displayName: string;
    bootstrapKey: string;
  }) {
    const auth = getClientAuth();
    const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);
    if (input.displayName) {
      await updateProfile(credential.user, { displayName: input.displayName });
    }

    const token = await credential.user.getIdToken();
    await syncSessionCookie(token);
    const response = await fetch("/api/auth/bootstrap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        displayName: input.displayName,
        bootstrapKey: input.bootstrapKey
      })
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      await clearSessionCookie().catch(() => null);
      await deleteUser(credential.user).catch(() => null);
      await firebaseSignOut(auth).catch(() => null);
      throw new Error(data.error ?? "Nao foi possivel inicializar o primeiro administrador.");
    }

    await refreshProfile();
  }

  async function requestPasswordReset(email: string) {
    const auth = getClientAuth();
    await sendPasswordResetEmail(auth, email);
  }

  return (
    <AuthContext.Provider
      value={{
        firebaseUserId,
        idToken,
        profile,
        loading,
        signIn,
        signOut,
        createInitialAdmin,
        requestPasswordReset,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }

  return context;
}
