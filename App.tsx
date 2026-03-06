
import React, { useState } from 'react';
import SplashScreen from './components/SplashScreen';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import GoogleSearchSim from './components/GoogleSearchSim';
import AppStoreListing from './components/AppStoreListing';
import { AuthStatus, UserProfile } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<AuthStatus>('search');
  const [user, setUser] = useState<UserProfile | null>(null);

  const handleSearchSelect = () => {
    setView('splash');
  };

  const handleSplashFinish = () => {
    setView('auth');
  };

  const handleLogin = (userProfile: UserProfile) => {
    console.log(`Logging in via ${userProfile.provider}: ${userProfile.email}`);
    setUser(userProfile);
    setView('dashboard');
  };

  const handleOpenAppStore = () => {
    setView('appstore');
  };

  return (
    <div className="bg-black min-h-screen">
      {view === 'search' && <GoogleSearchSim onSelectResult={handleSearchSelect} />}
      {view === 'splash' && <SplashScreen onFinish={handleSplashFinish} />}
      {view === 'auth' && <AuthScreen onLogin={handleLogin} onOpenAppStore={handleOpenAppStore} />}
      {view === 'dashboard' && user && <Dashboard user={user} onOpenAppStore={handleOpenAppStore} />}
      {view === 'appstore' && <AppStoreListing onBack={() => setView('auth')} />}
    </div>
  );
};

export default App;
