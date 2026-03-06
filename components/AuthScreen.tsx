
import React, { useState } from 'react';
import Logo from './Logo';
import { X, User, ShieldCheck, ChevronRight, Globe, Lock } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthScreenProps {
  onLogin: (user: UserProfile) => void;
  onOpenAppStore: () => void;
}

interface MockAccount {
  name: string;
  email: string;
  initial: string;
  color: string;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onOpenAppStore }) => {
  const [pickerType, setPickerType] = useState<'google' | 'apple' | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const googleAccounts: MockAccount[] = [
    { name: 'Daksh Jagatiya', email: 'daksh.jagatiya@gmail.com', initial: 'D', color: 'bg-blue-600' },
    { name: 'Champ AI', email: 'hello@champai.com', initial: 'C', color: 'bg-zinc-800' }
  ];

  const appleAccounts: MockAccount[] = [
    { name: 'Daksh Jagatiya', email: 'd.jagatiya@icloud.com', initial: '', color: 'bg-black' },
    { name: 'Safari User', email: 'user_482@privaterelay.appleid.com', initial: 'S', color: 'bg-zinc-700' }
  ];

  const handleProviderClick = (type: 'google' | 'apple') => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setPickerType(type);
      setIsAuthenticating(false);
    }, 450);
  };

  const handleAccountSelect = (account: MockAccount) => {
    setIsAuthenticating(true);
    setTimeout(() => {
      onLogin({
        name: account.name,
        email: account.email,
        initial: account.initial,
        color: account.color,
        provider: pickerType === 'google' ? 'google' : 'apple'
      });
    }, 1100);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-25%] right-[-15%] w-[70%] h-[70%] bg-zinc-900/40 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-[-25%] left-[-15%] w-[70%] h-[70%] bg-zinc-900/40 rounded-full blur-[160px] pointer-events-none"></div>

      <div className="max-w-md w-full flex flex-col items-center z-10 fade-in">
        <div className="mb-14 hover:rotate-12 transition-transform duration-500 cursor-pointer">
          <Logo size="lg" showText={false} />
        </div>
        
        <div className="text-center mb-14">
          <h1 className="text-5xl font-black text-white mb-5 tracking-tighter">
            Think <span className="text-zinc-500 italic font-serif">bigger</span>.
          </h1>
          <p className="text-zinc-400 text-lg font-medium opacity-80 leading-relaxed max-w-[280px] mx-auto">
            Your intelligence workspace at <span className="text-white">champai.com</span>
          </p>
        </div>

        <div className="w-full space-y-4">
          <button 
            disabled={isAuthenticating}
            onClick={() => handleProviderClick('google')}
            className="w-full bg-white text-black font-bold h-[66px] rounded-[22px] flex items-center justify-center gap-4 btn-auth-hover relative overflow-hidden active:scale-95"
          >
            {isAuthenticating && !pickerType ? (
              <div className="w-5 h-5 border-2 border-black/10 border-t-black rounded-full animate-spin"></div>
            ) : (
              <>
                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5" alt="Google" />
                <span className="text-[15px] tracking-tight">Sign in with Google</span>
              </>
            )}
          </button>
          
          <button 
            disabled={isAuthenticating}
            onClick={() => handleProviderClick('apple')}
            className="w-full bg-[#111] text-white font-bold h-[66px] rounded-[22px] flex items-center justify-center gap-4 border border-zinc-800 btn-auth-hover active:scale-95"
          >
             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05 1.61-3.21 1.61-1.11 0-1.46-.68-2.73-.68-1.29 0-1.68.65-2.73.65-1.13 0-2.3-.85-3.32-1.78C2.98 18.12 1.5 14.88 1.5 11.72c0-3.06 2-4.66 3.93-4.66 1.05 0 1.87.65 2.65.65.73 0 1.7-.72 2.9-.72.48 0 1.95.05 3.01 1.58-.08.05-1.81 1.05-1.81 3.12 0 2.48 2.15 3.35 2.18 3.36-.02.05-.34 1.18-1.31 2.23M11.75 4.54c-.05-.98.81-2.02 1.75-2.02.13 0 .28.02.41.05.13.98-.82 2.05-1.76 2.05-.15 0-.28-.02-.4-.08" />
            </svg>
            <span className="text-[15px] tracking-tight">Sign in with Safari</span>
          </button>

          <div className="flex items-center gap-5 py-6">
            <div className="h-px flex-1 bg-zinc-900"></div>
            <Lock size={12} className="text-zinc-800" />
            <div className="h-px flex-1 bg-zinc-900"></div>
          </div>

          <button 
            onClick={() => onLogin({
              name: 'Guest User',
              email: 'guest@champai.com',
              initial: 'G',
              color: 'bg-zinc-700',
              provider: 'guest'
            })}
            className="w-full text-zinc-500 font-bold py-3 hover:text-white transition-colors text-[10px] tracking-[0.3em] uppercase"
          >
            Access as guest
          </button>
        </div>

        {/* Store Badges Section */}
        <div className="mt-16 flex flex-col items-center gap-6">
          <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em]">Available on all platforms</p>
          <div className="flex items-center gap-4">
            <button onClick={onOpenAppStore} className="h-10 transition-transform hover:scale-105 active:scale-95">
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="h-full border border-zinc-800 rounded-lg p-0.5" />
            </button>
            <button onClick={onOpenAppStore} className="h-10 transition-transform hover:scale-105 active:scale-95">
              <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Play Store" className="h-full border border-zinc-800 rounded-lg p-0.5" />
            </button>
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 text-zinc-800">
            <ShieldCheck size={14} />
            <span className="text-[9px] font-black uppercase tracking-[0.25em]">Secure Protocol</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-900 font-mono text-[9px] font-bold">
            <Globe size={10} />
            WWW.CHAMPAI.COM
          </div>
        </div>
      </div>

      {pickerType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setPickerType(null)}></div>
          
          <div className={`relative w-full max-w-sm ${pickerType === 'google' ? 'bg-white text-black' : 'bg-zinc-950 text-white'} rounded-[36px] overflow-hidden shadow-[0_60px_120px_-30px_rgba(0,0,0,1)] scale-in-center border ${pickerType === 'google' ? 'border-zinc-100' : 'border-zinc-800'}`}>
            
            <div className={`p-9 ${pickerType === 'google' ? 'border-b border-zinc-50' : 'border-b border-zinc-900'} flex flex-col items-center gap-6`}>
              {pickerType === 'google' ? (
                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-12 h-12" alt="Google" />
              ) : (
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05 1.61-3.21 1.61-1.11 0-1.46-.68-2.73-.68-1.29 0-1.68.65-2.73.65-1.13 0-2.3-.85-3.32-1.78C2.98 18.12 1.5 14.88 1.5 11.72c0-3.06 2-4.66 3.93-4.66 1.05 0 1.87.65 2.65.65.73 0 1.7-.72 2.9-.72.48 0 1.95.05 3.01 1.58-.08.05-1.81 1.05-1.81 3.12 0 2.48 2.15 3.35 2.18 3.36-.02.05-.34 1.18-1.31 2.23M11.75 4.54c-.05-.98.81-2.02 1.75-2.02.13 0 .28.02.41.05.13.98-.82 2.05-1.76 2.05-.15 0-.28-.02-.4-.08" />
                </svg>
              )}
              <div className="text-center">
                <h3 className={`text-2xl font-black tracking-tight ${pickerType === 'google' ? 'text-zinc-900' : 'text-white'}`}>
                  {pickerType === 'google' ? 'Choose an account' : 'Sign in with Apple ID'}
                </h3>
                <p className={`text-sm mt-2 font-medium ${pickerType === 'google' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  To continue to <span className={pickerType === 'google' ? 'text-zinc-900 font-bold' : 'text-zinc-300 font-bold'}>Champ AI</span>
                </p>
              </div>
            </div>
            
            <div className="p-3 pb-2">
              {(pickerType === 'google' ? googleAccounts : appleAccounts).map((acc, i) => (
                <button
                  key={i}
                  disabled={isAuthenticating}
                  onClick={() => handleAccountSelect(acc)}
                  className={`w-full flex items-center gap-4 p-5 transition-all rounded-[24px] group text-left ${pickerType === 'google' ? 'hover:bg-zinc-50' : 'hover:bg-zinc-900'}`}
                >
                  <div className={`w-12 h-12 rounded-full ${acc.color} flex items-center justify-center text-white font-black shadow-md shrink-0 text-xl`}>
                    {acc.initial}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className={`font-bold text-[16px] ${pickerType === 'google' ? 'text-zinc-900' : 'text-white'}`}>{acc.name}</div>
                    <div className={`text-[14px] truncate ${pickerType === 'google' ? 'text-zinc-500' : 'text-zinc-500'}`}>{acc.email}</div>
                  </div>
                  <ChevronRight size={20} className={pickerType === 'google' ? 'text-zinc-200' : 'text-zinc-800'} />
                </button>
              ))}
              
              <button
                className={`w-full flex items-center gap-4 p-5 transition-all rounded-[24px] group text-left ${pickerType === 'google' ? 'hover:bg-zinc-50 text-zinc-600' : 'hover:bg-zinc-900 text-zinc-500'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${pickerType === 'google' ? 'bg-zinc-100' : 'bg-zinc-900 border border-zinc-800'}`}>
                  <User size={22} />
                </div>
                <div className="text-[16px] font-bold">Use another account</div>
              </button>
            </div>
            
            <div className={`p-8 mt-4 ${pickerType === 'google' ? 'bg-zinc-50/70' : 'bg-zinc-900/50'}`}>
              <p className={`text-[11px] leading-relaxed text-center font-medium ${pickerType === 'google' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                To safely sign you in, {pickerType === 'google' ? 'Google' : 'Apple'} will share your profile with <strong>Champ AI</strong>. Read the <a href="#" className="underline decoration-zinc-800 underline-offset-2">Privacy Policy</a>.
              </p>
            </div>

            {isAuthenticating && (
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-[110] backdrop-blur-[2px]">
                <div className={`p-6 rounded-[32px] ${pickerType === 'google' ? 'bg-white shadow-2xl border border-zinc-100' : 'bg-zinc-900 shadow-2xl border border-zinc-800'} flex flex-col items-center gap-4`}>
                  <div className={`w-8 h-8 border-[3.5px] rounded-full animate-spin ${pickerType === 'google' ? 'border-zinc-100 border-t-blue-600' : 'border-zinc-800 border-t-white'}`}></div>
                  <span className={`text-[12px] font-black uppercase tracking-[0.2em] ${pickerType === 'google' ? 'text-zinc-900' : 'text-white'}`}>Authorizing</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthScreen;
