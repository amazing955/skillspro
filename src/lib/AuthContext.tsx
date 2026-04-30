import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: any | null;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch or create profile
        try {
          const userDoc = doc(db, 'users', user.uid);
          let snapshot;
          try {
            snapshot = await getDoc(userDoc);
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
            return;
          }
          
          // Check if user should be admin based on email
          const isAdminEmail = user.email === 'clintonatulinde@gmail.com';
          
          if (!snapshot.exists()) {
            const newProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              role: isAdminEmail ? 'admin' : 'student',
              savingsBalance: 0,
              phoneNumber: '',
              idVerified: isAdminEmail,
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(userDoc, newProfile);
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
            }
            setProfile(newProfile);
            
            // If admin, also create document in admins collection for security rules
            if (isAdminEmail) {
              try {
                await setDoc(doc(db, 'admins', user.uid), { active: true });
              } catch (err) {
                handleFirestoreError(err, OperationType.CREATE, `admins/${user.uid}`);
              }
            }
          } else {
            const existingData = snapshot.data();
            // Force admin role for the specific email if not already set
            if (isAdminEmail && existingData.role !== 'admin') {
              const updated = { ...existingData, role: 'admin', idVerified: true };
              try {
                await setDoc(userDoc, updated);
                await setDoc(doc(db, 'admins', user.uid), { active: true });
              } catch (err) {
                handleFirestoreError(err, OperationType.WRITE, `admin_bootstrap/${user.uid}`);
              }
              setProfile(updated);
            } else {
              setProfile(existingData);
            }
          }
        } catch (error) {
          console.error("Critical error in profile setup:", error);
        }
      } else {
        setProfile(null);
      }
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      // Add custom parameters to help with iframe/popup issues
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Auth error:", error.code, error.message);
      if (error.code === 'auth/popup-blocked') {
        alert("Sign-in popup was blocked by your browser. Please allow popups for this site and try again.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Ignore this as it usually means user closed popup or triggered another one
      } else if (error.message?.includes('INTERNAL ASSERTION FAILED')) {
        alert("A technical error occurred in the authentication service. Please try refreshing the page.");
      } else {
        alert(`Authentication failed: ${error.message}`);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, profile, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
