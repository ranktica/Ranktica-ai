
import React, { useState } from 'react';
import { useAuth } from '@/infrastructure/auth/AuthContext';
import { UserPlus, LogIn, Youtube, Gift } from 'lucide-react';

export const Auth: React.FC = () => {
  const { login, signup, signInWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [referral, setReferral] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      login(email);
    } else {
      signup(email, name, referral);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-red-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
              <Youtube size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Ranktica AI</h1>
          <p className="text-zinc-400">
            {isLogin ? 'Welcome back, Creator.' : 'Start your viral journey.'}
          </p>
        </div>

        <div className="bg-[#0f0f12] border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  placeholder="Mr. Beast"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                placeholder="creator@example.com"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Referral Code (Optional)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={referral}
                    onChange={(e) => setReferral(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-red-500 outline-none transition-all pl-10"
                    placeholder="FRIEND123"
                  />
                  <Gift size={18} className="absolute left-3 top-3.5 text-zinc-500" />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-center justify-center gap-2 mt-6 active-press"
            >
              {isLogin ? (
                <>
                  <LogIn size={20} /> Login
                </>
              ) : (
                <>
                  <UserPlus size={20} /> Create Account
                </>
              )}
            </button>

            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-zinc-800"></div>
              <span className="mx-3 text-[10px] font-black uppercase text-zinc-500 tracking-wider">OR VERIFY ENTERPRISE SSO</span>
              <div className="flex-1 border-t border-zinc-800"></div>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={signInWithGoogle}
                className="w-full bg-[#141417] border border-zinc-850 hover:border-zinc-700 text-zinc-350 hover:text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-3 active-press"
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-[18px] h-[18px] shrink-0">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                Sign in with Google
              </button>

              <button
                type="button"
                onClick={() => login('joinranktica@gmail.com')}
                className="w-full bg-indigo-950/60 border border-indigo-800/80 hover:bg-indigo-900 text-indigo-300 font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
              >
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                Sign in with SAML 2.0 (Okta / Azure AD / Workspace)
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-zinc-500 hover:text-white text-sm transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
          </div>
        </div>
        
        {!isLogin && (
          <p className="text-center text-xs text-zinc-600 mt-6">
            By signing up, you agree to our Terms. You will receive a 1-Day Free Trial.
          </p>
        )}
      </div>
    </div>
  );
};
