
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, PlanType, UserStats } from '@/shared/types';
import { auth, loginWithGoogle, handleSignOut, getCachedToken } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { secureStorage } from '@/shared/secureStorage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  signup: (email: string, name: string, referralCode?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  upgradeToPro: (plan: PlanType) => void;
  renewPlan: () => void;
  checkPlanStatus: () => { 
    isValid: boolean; 
    daysLeft: number; 
    isFree: boolean; 
    plan: PlanType;
    isExpiringSoon: boolean;
  };
  incrementStat: (key: keyof UserStats) => void;
  googleToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_STATS: UserStats = {
  ideasGenerated: 0,
  scriptsWritten: 0,
  thumbnailsCreated: 0,
  seoOptimized: 0,
  marketingPlans: 0
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [googleToken, setGoogleToken] = useState<string | null>(null);

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = await secureStorage.getItem('tf_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (parseErr) {
            console.error('[AuthContext] Stored user was corrupted or failed decryption, purging:', parseErr);
            await secureStorage.removeItem('tf_user');
            setUser(null);
          }
        }
      } catch (err) {
        console.error('[AuthContext] Failed to load stored user from IndexDB:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStoredUser();
    
    // Subscribe to Firebase Auth and token tracking
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const token = getCachedToken();
        if (token) {
          setGoogleToken(token);
        }
      } else {
        setGoogleToken(null);
      }
    });

    const handleRecovery = () => {
      console.log('[AuthContext] Graceful recovery triggered, reloading user info...');
      loadStoredUser();
    };
    window.addEventListener('ranktica-graceful-recovery', handleRecovery);

    return () => {
      unsubscribe();
      window.removeEventListener('ranktica-graceful-recovery', handleRecovery);
    };
  }, []);

  const login = async (email: string) => {
    try {
      const storedUser = await secureStorage.getItem('tf_user');
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u.email === email) {
            setUser(u);
            return;
          }
        } catch (parseErr) {
          console.error('[AuthContext] Login parsing error on secure storage, clearing:', parseErr);
          await secureStorage.removeItem('tf_user');
        }
      }
      alert('User not found. Please sign up.');
    } catch (err) {
      console.error('[AuthContext] Login read failed:', err);
    }
  };

  const signup = async (email: string, name: string, referredBy?: string) => {
    const referralCode = name.substring(0, 3).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
    const newUser: User = {
      email,
      name,
      plan: 'free',
      planStartDate: Date.now(),
      referralCode,
      referredBy,
      stats: DEFAULT_STATS
    };
    await secureStorage.setItem('tf_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      const res = await loginWithGoogle();
      setGoogleToken(res.token);
      
      // Upgrade auto-provisioning plan to enterprise level for Google Workspace verified creators
      const newUser: User = {
        email: res.email,
        name: res.name,
        plan: 'enterprise',
        planStartDate: Date.now(),
        referralCode: res.name.substring(0, 3).toUpperCase() + Math.floor(1000 + Math.random() * 9000),
        stats: DEFAULT_STATS
      };
      
      await secureStorage.setItem('tf_user', JSON.stringify(newUser));
      setUser(newUser);
    } catch (err: any) {
      console.error('Google authorization error:', err);
      alert(err.message || 'Google OAuth integration failed. Check configuration setup.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await handleSignOut();
    } catch (e) {
      console.error(e);
    }
    setGoogleToken(null);
    await secureStorage.removeItem('tf_user');
    setUser(null);
  };

  const upgradeToPro = (plan: PlanType) => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      plan: plan,
      planStartDate: Date.now()
    };
    secureStorage.setItem('tf_user', JSON.stringify(updatedUser)).catch(console.error);
    setUser(updatedUser);
  };

  const renewPlan = () => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      planStartDate: Date.now() // Reset cycle
    };
    secureStorage.setItem('tf_user', JSON.stringify(updatedUser)).catch(console.error);
    setUser(updatedUser);
  };

  const checkPlanStatus = () => {
    if (!user) return { isValid: false, daysLeft: 0, isFree: true, plan: 'free' as PlanType, isExpiringSoon: false };

    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysSinceStart = (now - user.planStartDate) / msPerDay;
    const planDuration = user.plan === 'free' ? 1 : 180; // Extended duration for OAuth creators
    
    const daysLeft = Math.max(0, Math.ceil(planDuration - daysSinceStart));
    const isExpiringSoon = daysLeft <= 5 && daysLeft > 0;

    return {
      isValid: daysSinceStart < planDuration,
      daysLeft,
      isFree: user.plan === 'free',
      plan: user.plan,
      isExpiringSoon
    };
  };

  const incrementStat = (key: keyof UserStats) => {
    if (!user) return;
    const currentStats = user.stats || DEFAULT_STATS;
    const newStats = { ...currentStats, [key]: (currentStats[key] || 0) + 1 };
    const updatedUser = { ...user, stats: newStats };
    setUser(updatedUser);
    secureStorage.setItem('tf_user', JSON.stringify(updatedUser)).catch(console.error);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, signInWithGoogle, logout, upgradeToPro, renewPlan, checkPlanStatus, incrementStat, googleToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
