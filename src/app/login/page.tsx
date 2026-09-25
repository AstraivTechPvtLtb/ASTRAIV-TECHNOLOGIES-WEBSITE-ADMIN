'use client';

/**
 * @file admin/src/app/login/page.tsx
 * @description [VIEW] Admin Login Screen with OTP-preferred authentication, Supabase Email OTP, password fallback, and Forgot Password OTP recovery.
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  loginAdmin,
  sendAdminLoginOtp,
  verifyAdminLoginOtp,
  sendAdminForgotPasswordOtp,
  verifyAdminForgotPasswordOtp,
  resetAdminPasswordWithOtp,
} from '@/controllers/auth.controller';
import { DEFAULT_ADMIN_EMAIL } from '@/models/types';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  Terminal,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect') || '/dashboard';
  // Strictly prevent Open Redirect vulnerabilities: allow only local relative paths
  const redirectTarget =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') && !rawRedirect.includes(':')
      ? rawRedirect
      : '/dashboard';

  // Auth Mode: 'otp' (default) | 'password' | 'forgot_password'
  const [authMode, setAuthMode] = useState<'otp' | 'password' | 'forgot_password'>('otp');

  // Forgot Password Wizard Step: 'request_otp' | 'verify_otp' | 'new_password'
  const [forgotStep, setForgotStep] = useState<'request_otp' | 'verify_otp' | 'new_password'>('request_otp');

  // Form State - Login
  const [email, setEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State - Forgot Password
  const [forgotOtp, setForgotOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle Send Login OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      setError('Please provide your administrator email.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await sendAdminLoginOtp(email);
      if (res.success) {
        setOtpSent(true);
        setMessage(res.message || 'Verification code sent to your email.');
        setResendCooldown(60);
      } else {
        setError(res.error || 'Failed to dispatch verification code.');
      }
    } catch {
      setError('An unexpected error occurred while requesting OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Verify Login OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 6) {
      setError('Please enter the complete verification code.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await verifyAdminLoginOtp(email, otp);
      if (res.success) {
        router.push(redirectTarget);
        router.refresh();
      } else {
        setError(res.error || 'Invalid or expired OTP code.');
      }
    } catch {
      setError('An error occurred while verifying OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await loginAdmin(email, password);
      if (res.success) {
        router.push(redirectTarget);
        router.refresh();
      } else {
        setError(res.error || 'Invalid credentials or unauthorized account.');
      }
    } catch {
      setError('An unexpected error occurred during password authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password - Step 1: Request OTP
  const handleRequestForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Administrator email is required.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await sendAdminForgotPasswordOtp(email);
      if (res.success) {
        setForgotStep('verify_otp');
        setMessage(res.message || 'Verification code sent to your email.');
        setResendCooldown(60);
      } else {
        setError(res.error || 'Failed to dispatch reset code.');
      }
    } catch {
      setError('An unexpected error occurred while requesting reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password - Step 2: Verify OTP
  const handleVerifyForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp || forgotOtp.trim().length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await verifyAdminForgotPasswordOtp(email, forgotOtp);
      if (res.success && res.data?.resetToken) {
        setResetToken(res.data.resetToken);
        setForgotStep('new_password');
        setMessage('OTP verified successfully. Please enter your new password.');
      } else {
        setError(res.error || 'Invalid or expired OTP code.');
      }
    } catch {
      setError('An unexpected error occurred while verifying reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password - Step 3: Save New Password & Redirect
  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await resetAdminPasswordWithOtp({
        email,
        resetToken,
        otp: forgotOtp,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        // Clear forgot password state and redirect back to password login
        setForgotOtp('');
        setResetToken('');
        setNewPassword('');
        setConfirmPassword('');
        setPassword('');
        setAuthMode('password');
        setMessage('Password updated successfully! Please sign in with your new password.');
      } else {
        setError(res.error || 'Failed to update password.');
      }
    } catch {
      setError('An unexpected error occurred while saving password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl shadow-blue-950/20 space-y-6">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-13 w-13 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/30">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            {authMode === 'forgot_password' ? 'RESET PASSWORD' : 'ASTRAIV ADMIN PORTAL'}
          </h1>
          <p className="text-xs text-slate-400">
            {authMode === 'forgot_password'
              ? 'Administrator credential recovery via verified OTP'
              : 'Secure administrative control center & JWT authorization'}
          </p>
        </div>

        {/* Auth Mode Switcher (Hidden in Forgot Password mode) */}
        {authMode !== 'forgot_password' && (
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('otp');
                setError('');
                setMessage('');
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all cursor-pointer ${
                authMode === 'otp'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Email OTP</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-400/20 text-blue-200 border border-blue-400/30">
                Preferred
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('password');
                setError('');
                setMessage('');
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all cursor-pointer ${
                authMode === 'password'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Password</span>
            </button>
          </div>
        )}

        {/* Feedback Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {/* Local Console Developer Tip (Shown strictly in local development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
            <Terminal className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span>Local login & reset OTP is printed in your server terminal console.</span>
          </div>
        )}

        {/* TAB 1: OTP AUTHENTICATION (DEFAULT) */}
        {authMode === 'otp' && (
          <div>
            {!otpSent ? (
              // Step 1: Send OTP
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Administrator Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="astraivtechnologies@gmail.com"
                      required
                      autoComplete="email"
                      className="pl-10 h-11 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:border-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    A free one-time verification code will be dispatched via Supabase Auth.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send Login Code (OTP)</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              // Step 2: Enter & Verify 6-digit OTP
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Code sent to: <span className="font-semibold text-slate-200">{email}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                      setMessage('');
                      setError('');
                    }}
                    className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer underline text-[11px]"
                  >
                    Change Email
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Enter Verification Code
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    pattern="[0-9]*"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="--------"
                    autoFocus
                    required
                    className="h-12 bg-slate-950 border-slate-800 text-slate-100 text-center font-mono text-xl tracking-[0.35em] font-bold focus-visible:border-blue-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || otp.length < 6}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Verify & Enter Admin Portal</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center pt-2">
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isLoading}
                    onClick={() => handleSendOtp()}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="h-3 w-3" />
                    {resendCooldown > 0 ? (
                      <span>Resend code in {resendCooldown}s</span>
                    ) : (
                      <span>Resend verification code</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: PASSWORD AUTHENTICATION (SECONDARY) */}
        {authMode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="astraivtechnologies@gmail.com"
                  required
                  autoComplete="email"
                  className="pl-10 h-11 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Password
                </label>
                {/* FORGOT PASSWORD BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('forgot_password');
                    setForgotStep('request_otp');
                    setError('');
                    setMessage('');
                  }}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer underline-offset-2 hover:underline transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  required
                  autoComplete="current-password"
                  className="pl-10 pr-10 h-11 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 mt-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Access Control Center</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        )}

        {/* FORGOT PASSWORD WIZARD (MULTI-STEP RECOVERY) */}
        {authMode === 'forgot_password' && (
          <div className="space-y-4">
            {/* Step 1: Request OTP */}
            {forgotStep === 'request_otp' && (
              <form onSubmit={handleRequestForgotOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Administrator Email for Reset
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="astraivtechnologies@gmail.com"
                      required
                      autoComplete="email"
                      className="pl-10 h-11 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:border-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    A 6-digit password reset OTP will be sent to this email address.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send Password Reset OTP</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('password');
                      setError('');
                      setMessage('');
                    }}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to Login Options</span>
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Enter & Verify OTP */}
            {forgotStep === 'verify_otp' && (
              <form onSubmit={handleVerifyForgotOtp} className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Reset code sent to: <span className="font-semibold text-slate-200">{email}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('request_otp');
                      setForgotOtp('');
                      setError('');
                    }}
                    className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer underline text-[11px]"
                  >
                    Change
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Enter Verification Code
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    pattern="[0-9]*"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="--------"
                    autoFocus
                    required
                    className="h-12 bg-slate-950 border-slate-800 text-slate-100 text-center font-mono text-xl tracking-[0.35em] font-bold focus-visible:border-blue-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || forgotOtp.length < 6}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Verify Code & Proceed</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('password');
                      setError('');
                      setMessage('');
                    }}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to Login</span>
                  </button>

                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isLoading}
                    onClick={() => handleRequestForgotOtp({ preventDefault: () => {} } as React.FormEvent)}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 disabled:opacity-50 cursor-pointer font-semibold"
                  >
                    <RotateCcw className="h-3 w-3" />
                    {resendCooldown > 0 ? `${resendCooldown}s` : 'Resend'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Enter New Password & Save -> Redirect back to Login */}
            {forgotStep === 'new_password' && (
              <form onSubmit={handleSaveNewPassword} className="space-y-4">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-blue-400" />
                  <span>OTP verified! Set your new administrator password.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    New Password (min 8 chars)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      autoFocus
                      className="pl-10 pr-10 h-11 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
                      tabIndex={-1}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Re-Enter Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                      className="pl-10 pr-10 h-11 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !newPassword || !confirmPassword || newPassword.length < 8}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Save New Password</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('password');
                      setError('');
                      setMessage('');
                    }}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Cancel and Return to Login</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
