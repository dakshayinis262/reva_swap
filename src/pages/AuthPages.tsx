import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, MailCheck, ShieldCheck, Upload } from 'lucide-react';
import { api, uploadImageFile } from '../api/client';
import { DEPARTMENTS, PICKUP_LOCATIONS, YEARS_OF_STUDY } from '../constants';
import { useAuth } from '../context/AuthContext';

export type AuthMode = 'login' | 'register' | 'forgot-password' | 'profile-setup';

interface AuthPagesProps {
  mode: AuthMode;
  onChangeMode: (mode: AuthMode) => void;
  onComplete: (role: 'student' | 'admin') => void;
  onBackHome: () => void;
}

export function AuthPages({
  mode,
  onChangeMode,
  onComplete,
  onBackHome,
}: AuthPagesProps) {
  const { user, setUserSession, refreshUser, notify } = useAuth();

  // Registration state
  const [regForm, setRegForm] = useState({
    fullName: '',
    email: '',
    studentId: '',
    department: DEPARTMENTS[0],
    yearOfStudy: YEARS_OF_STUDY[0],
    password: '',
    confirmPassword: '',
  });
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState<string | null>(null);
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStage, setResetStage] = useState<'request' | 'confirm'>('request');
  const [demoResetHint, setDemoResetHint] = useState<string | null>(null);

  // Profile setup state
  const [profileForm, setProfileForm] = useState({
    bio: user?.bio || '',
    preferredPickup: user?.preferredPickup || PICKUP_LOCATIONS[0],
    avatarUrl: user?.avatarUrl || '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.register(regForm);
      setPendingVerifyEmail(res.email);
      setDemoCodeHint(res.demoVerificationCode);
      notify('Account created! Please verify your campus email.', 'success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingVerifyEmail) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.verifyEmail(pendingVerifyEmail, verifyCode);
      setUserSession(res.user, res.token);
      setPendingVerifyEmail(null);
      notify('Campus email verified! Complete your profile setup.', 'success');
      onChangeMode('profile-setup');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.login(loginEmail, loginPassword);
      setUserSession(res.user, res.token);
      notify(`Welcome back, ${res.user.fullName}!`, 'success');
      if (!res.user.profileCompleted && res.user.role === 'student') {
        onChangeMode('profile-setup');
      } else {
        onComplete(res.user.role);
      }
    } catch (err: unknown) {
      const typed = err as Error & {
        data?: {
          requiresVerification?: boolean;
          email?: string;
          demoVerificationCode?: string;
        };
      };
      if (typed.data?.requiresVerification && typed.data.email) {
        setPendingVerifyEmail(typed.data.email);
        setDemoCodeHint(typed.data.demoVerificationCode || null);
        onChangeMode('register');
      }
      setError(typed.message || 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.forgotPassword(resetEmail);
      setDemoResetHint(res.demoResetCode);
      setResetStage('confirm');
      notify('Reset code generated.', 'info');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to send reset code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.resetPassword(resetEmail, resetCode, newPassword);
      notify('Password updated! Please sign in.', 'success');
      setResetStage('request');
      onChangeMode('login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reset failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImageFile(file);
      setProfileForm((p) => ({ ...p, avatarUrl: url }));
      notify('Profile photo uploaded.', 'success');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Upload failed.', 'error');
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.updateProfile({
        bio: profileForm.bio,
        preferredPickup: profileForm.preferredPickup,
        avatarUrl: profileForm.avatarUrl,
        profileCompleted: true,
      });
      await refreshUser();
      notify('Profile setup saved!', 'success');
      onComplete(user?.role || 'student');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] py-10 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Left Context Panel */}
        <div className="lg:col-span-5 bg-[#172554] text-white p-8 sm:p-10 flex flex-col justify-between gap-8">
          <div>
            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white mb-8 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to REVA SWAP</span>
            </button>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              {mode === 'login' && 'Welcome back to campus sharing'}
              {mode === 'register' &&
                (pendingVerifyEmail
                  ? 'Verify your university email'
                  : 'Join your verified campus exchange')}
              {mode === 'forgot-password' && 'Recover your student account'}
              {mode === 'profile-setup' && 'Set up your student profile'}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              REVA SWAP connects verified students to borrow, lend, swap, buy,
              sell, and share textbooks, lab kits, and essentials safely on campus.
            </p>
          </div>

          <div className="space-y-3 pt-6 border-t border-white/15 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#14B8A6] shrink-0" />
              <span>Campus email verification (@reva.edu.in / .edu)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#14B8A6] shrink-0" />
              <span>Tracked borrowing handover & return condition logs</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-6 sm:p-10">
          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800"
            >
              {error}
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <div>
              <h2 className="font-display text-xl font-bold text-[#172554] mb-1">
                Student & Admin Sign In
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Sign in with your verified university credentials.
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    University Email
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="student@reva.edu.in"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        onChangeMode('forgot-password');
                      }}
                      className="text-xs font-medium text-[#6D5CE7] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#172554] hover:bg-[#1e3270] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                >
                  {submitting ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              {/* Demo Quick-Fill Box */}
              <div className="mt-6 pt-5 border-t border-slate-200">
                <p className="text-xs font-medium text-slate-500 mb-2.5">
                  Demo Accounts (for instant exploration):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('ananya.sharma@reva.edu.in');
                      setLoginPassword('Student@2026');
                    }}
                    className="text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-[#6D5CE7] bg-slate-50 text-xs transition-colors cursor-pointer"
                  >
                    <span className="block font-semibold text-[#172554]">
                      Student Demo (Ananya)
                    </span>
                    <span className="text-slate-500">ananya.sharma@reva.edu.in</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('admin@reva.edu.in');
                      setLoginPassword('Admin@2026');
                    }}
                    className="text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-[#6D5CE7] bg-slate-50 text-xs transition-colors cursor-pointer"
                  >
                    <span className="block font-semibold text-[#172554]">
                      Campus Admin Demo
                    </span>
                    <span className="text-slate-500">admin@reva.edu.in</span>
                  </button>
                </div>
              </div>

              <p className="mt-6 text-sm text-center text-slate-600">
                New to REVA SWAP?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    onChangeMode('register');
                  }}
                  className="font-semibold text-[#6D5CE7] hover:underline cursor-pointer"
                >
                  Create Student Account
                </button>
              </p>
            </div>
          )}

          {/* REGISTRATION & EMAIL VERIFICATION */}
          {mode === 'register' && !pendingVerifyEmail && (
            <div>
              <h2 className="font-display text-xl font-bold text-[#172554] mb-1">
                Student Registration
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Use your official university email address for campus verification.
              </p>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={regForm.fullName}
                      onChange={(e) =>
                        setRegForm({ ...regForm, fullName: e.target.value })
                      }
                      placeholder="e.g., Arjun Verma"
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Student ID
                    </label>
                    <input
                      type="text"
                      required
                      value={regForm.studentId}
                      onChange={(e) =>
                        setRegForm({ ...regForm, studentId: e.target.value })
                      }
                      placeholder="e.g., R24CS105"
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    University Email
                  </label>
                  <input
                    type="email"
                    required
                    value={regForm.email}
                    onChange={(e) =>
                      setRegForm({ ...regForm, email: e.target.value })
                    }
                    placeholder="arjun.verma@reva.edu.in"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Department
                    </label>
                    <select
                      value={regForm.department}
                      onChange={(e) =>
                        setRegForm({ ...regForm, department: e.target.value })
                      }
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Year of Study
                    </label>
                    <select
                      value={regForm.yearOfStudy}
                      onChange={(e) =>
                        setRegForm({ ...regForm, yearOfStudy: e.target.value })
                      }
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
                    >
                      {YEARS_OF_STUDY.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={regForm.password}
                      onChange={(e) =>
                        setRegForm({ ...regForm, password: e.target.value })
                      }
                      placeholder="Min. 8 characters"
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={regForm.confirmPassword}
                      onChange={(e) =>
                        setRegForm({ ...regForm, confirmPassword: e.target.value })
                      }
                      placeholder="Repeat password"
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#172554] hover:bg-[#1e3270] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                >
                  {submitting ? 'Creating Account...' : 'Register & Verify Email'}
                </button>
              </form>

              <p className="mt-5 text-sm text-center text-slate-600">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    onChangeMode('login');
                  }}
                  className="font-semibold text-[#6D5CE7] hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            </div>
          )}

          {mode === 'register' && pendingVerifyEmail && (
            <div>
              <div className="w-11 h-11 rounded-xl bg-[#14B8A6]/10 text-[#14B8A6] flex items-center justify-center mb-4">
                <MailCheck className="w-6 h-6" />
              </div>
              <h2 className="font-display text-xl font-bold text-[#172554] mb-1">
                Campus Email Verification
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Enter the 6-digit verification code sent to{' '}
                <span className="font-medium text-slate-900">
                  {pendingVerifyEmail}
                </span>
                .
              </p>

              {demoCodeHint && (
                <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  Demonstration verification code (shown in absence of external SMTP):{' '}
                  <span className="font-mono font-bold text-[#172554]">
                    {demoCodeHint}
                  </span>
                </div>
              )}

              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full px-3.5 py-2.5 font-mono text-base tracking-widest rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#172554] hover:bg-[#1e3270] rounded-lg transition-colors cursor-pointer"
                >
                  {submitting ? 'Verifying...' : 'Verify Campus Email'}
                </button>
              </form>
            </div>
          )}

          {/* FORGOT PASSWORD */}
          {mode === 'forgot-password' && (
            <div>
              <h2 className="font-display text-xl font-bold text-[#172554] mb-1">
                Reset Password
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                {resetStage === 'request'
                  ? 'Enter your university email to receive a 6-digit reset code.'
                  : 'Enter the reset code and choose a new password.'}
              </p>

              {resetStage === 'request' ? (
                <form onSubmit={handleForgotRequest} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      University Email
                    </label>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@reva.edu.in"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#172554] hover:bg-[#1e3270] rounded-lg transition-colors cursor-pointer"
                  >
                    {submitting ? 'Sending...' : 'Request Reset Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleForgotConfirm} className="space-y-4">
                  {demoResetHint && (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      Demo reset code:{' '}
                      <span className="font-mono font-bold text-[#172554]">
                        {demoResetHint}
                      </span>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Reset Code
                    </label>
                    <input
                      type="text"
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="6-digit code"
                      className="w-full px-3.5 py-2 font-mono text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#172554] hover:bg-[#1e3270] rounded-lg transition-colors cursor-pointer"
                  >
                    {submitting ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              )}

              <p className="mt-5 text-sm text-center text-slate-600">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    onChangeMode('login');
                  }}
                  className="font-semibold text-[#6D5CE7] hover:underline cursor-pointer"
                >
                  Back to Sign In
                </button>
              </p>
            </div>
          )}

          {/* PROFILE SETUP */}
          {mode === 'profile-setup' && (
            <div>
              <h2 className="font-display text-xl font-bold text-[#172554] mb-1">
                Complete Your Student Profile
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Help campus peers recognize you and know your preferred pickup spot.
              </p>

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {profileForm.avatarUrl ? (
                      <img
                        src={profileForm.avatarUrl}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-display text-lg font-bold text-[#172554]">
                        {user?.fullName?.slice(0, 2).toUpperCase() || 'RS'}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#172554] bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Profile Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      Optional · PNG or JPG up to 5MB
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Preferred Campus Pickup Location
                  </label>
                  <select
                    value={profileForm.preferredPickup}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        preferredPickup: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
                  >
                    {PICKUP_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Short Student Bio
                  </label>
                  <textarea
                    rows={3}
                    value={profileForm.bio}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, bio: e.target.value })
                    }
                    placeholder="Share your department interests, usual campus hours, or items you frequently lend..."
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-[#172554] hover:bg-[#1e3270] rounded-lg transition-colors cursor-pointer"
                  >
                    {submitting ? 'Saving...' : 'Save & Continue to Dashboard'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onComplete(user?.role || 'student')}
                    className="py-2.5 px-4 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Skip for now
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
