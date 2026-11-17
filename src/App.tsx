import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/ToastContainer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthMode, AuthPages } from './pages/AuthPages';
import { ExplorePage } from './pages/ExplorePage';
import { ItemDetailsPage } from './pages/ItemDetailsPage';
import { LandingPage } from './pages/LandingPage';
import { StudentDashboard, WorkspaceTab } from './pages/StudentDashboard';

type AppView =
  | 'landing'
  | 'explore'
  | 'item-details'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'profile-setup'
  | 'dashboard'
  | 'admin';

function AppRouter() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<AppView>('landing');
  const [exploreCategory, setExploreCategory] = useState<string>('All');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [dashboardInitialTab, setDashboardInitialTab] =
    useState<WorkspaceTab>('overview');
  const [initialMessageTarget, setInitialMessageTarget] = useState<{
    recipientId: string;
    itemId: string;
  } | null>(null);

  const navigatePublic = (nextView: string, sectionId?: string) => {
    setView(nextView as AppView);
    if (nextView === 'landing' && sectionId) {
      setTimeout(() => {
        document
          .getElementById(sectionId)
          ?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="font-display text-xl font-bold text-[#172554]">
            REVA SWAP
          </p>
          <p className="text-xs text-slate-500">Loading campus marketplace...</p>
        </div>
      </div>
    );
  }

  // Authenticated Workspace View
  if ((view === 'dashboard' || view === 'admin') && user) {
    return (
      <>
        <StudentDashboard
          initialTab={view === 'admin' ? 'admin' : dashboardInitialTab}
          initialMessageTarget={initialMessageTarget}
          onExitToPublic={(pubView = 'landing') => {
            setDashboardInitialTab('overview');
            setInitialMessageTarget(null);
            setView(pubView);
          }}
        />
        <ToastContainer />
      </>
    );
  }

  // Public & Auth Views
  const authViews: AuthMode[] = [
    'login',
    'register',
    'forgot-password',
    'profile-setup',
  ];
  const isAuthView = authViews.includes(view as AuthMode);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar currentView={view} onNavigate={navigatePublic} />

      <main className="flex-1">
        {view === 'landing' && (
          <LandingPage
            onExplore={(cat) => {
              setExploreCategory(cat || 'All');
              setView('explore');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onJoin={() => {
              setView(user ? 'dashboard' : 'register');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectItem={(itemId) => {
              setSelectedItemId(itemId);
              setView('item-details');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {view === 'explore' && (
          <ExplorePage
            initialCategory={exploreCategory}
            onSelectItem={(itemId) => {
              setSelectedItemId(itemId);
              setView('item-details');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {view === 'item-details' && selectedItemId && (
          <ItemDetailsPage
            itemId={selectedItemId}
            onBack={() => setView('explore')}
            onRequireLogin={() => setView('login')}
            onOpenMessages={(recipientId, itemId) => {
              setInitialMessageTarget({ recipientId, itemId });
              setDashboardInitialTab('messages');
              setView('dashboard');
            }}
            onRequestCreated={() => {
              setDashboardInitialTab('my-requests');
              setView('dashboard');
            }}
          />
        )}

        {isAuthView && (
          <AuthPages
            mode={view as AuthMode}
            onChangeMode={(nextMode) => setView(nextMode)}
            onComplete={(role) => {
              setDashboardInitialTab(role === 'admin' ? 'admin' : 'overview');
              setView(role === 'admin' ? 'admin' : 'dashboard');
            }}
            onBackHome={() => setView('landing')}
          />
        )}
      </main>

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
