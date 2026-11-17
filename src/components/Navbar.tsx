import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type PublicRoute =
  | 'landing'
  | 'explore'
  | 'item-details'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'profile-setup'
  | 'dashboard';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, sectionId?: string) => void;
}

export function Navbar({ currentView, onNavigate }: NavbarProps) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLink = (view: string, sectionId?: string) => {
    setMobileOpen(false);
    onNavigate(view, sectionId);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single clean wordmark */}
        <button
          type="button"
          onClick={() => handleLink('landing')}
          className="font-display text-xl font-extrabold tracking-tight text-[#172554] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5CE7] rounded-md px-1"
        >
          REVA SWAP
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => handleLink('landing')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer hover:text-[#172554] py-1 border-b-2 ${
              currentView === 'landing'
                ? 'text-[#172554] border-[#172554]'
                : 'border-transparent'
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => handleLink('explore')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer hover:text-[#172554] py-1 border-b-2 ${
              currentView === 'explore'
                ? 'text-[#172554] border-[#172554]'
                : 'border-transparent'
            }`}
          >
            Explore Items
          </button>
          <button
            type="button"
            onClick={() => handleLink('landing', 'how-it-works')}
            className="whitespace-nowrap shrink-0 transition-colors cursor-pointer hover:text-[#172554] py-1 border-b-2 border-transparent"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => handleLink('landing', 'why-reva-swap')}
            className="whitespace-nowrap shrink-0 transition-colors cursor-pointer hover:text-[#172554] py-1 border-b-2 border-transparent"
          >
            About Us
          </button>
          {!user && (
            <button
              type="button"
              onClick={() => handleLink('login')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer hover:text-[#172554] py-1 border-b-2 ${
                currentView === 'login'
                  ? 'text-[#172554] border-[#172554]'
                  : 'border-transparent'
              }`}
            >
              Login
            </button>
          )}
        </nav>

        {/* Zone 3: Primary action */}
        <div className="hidden md:flex items-center shrink-0">
          {user ? (
            <button
              type="button"
              onClick={() =>
                handleLink(user.role === 'admin' ? 'admin' : 'dashboard')
              }
              className="px-4 py-2 text-sm font-semibold text-white bg-[#172554] hover:bg-[#1e3270] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5CE7]"
            >
              {user.role === 'admin' ? 'Admin Console' : 'Dashboard'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleLink('register')}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#172554] hover:bg-[#1e3270] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5CE7]"
            >
              Get Started
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          <button
            type="button"
            onClick={() => handleLink('landing')}
            className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => handleLink('explore')}
            className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Explore Items
          </button>
          <button
            type="button"
            onClick={() => handleLink('landing', 'how-it-works')}
            className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => handleLink('landing', 'why-reva-swap')}
            className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            About Us
          </button>
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <button
                type="button"
                onClick={() =>
                  handleLink(user.role === 'admin' ? 'admin' : 'dashboard')
                }
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#172554] rounded-lg"
              >
                {user.role === 'admin' ? 'Admin Console' : 'Go to Dashboard'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleLink('login')}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-[#172554] border border-slate-200 rounded-lg"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => handleLink('register')}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#172554] rounded-lg"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
