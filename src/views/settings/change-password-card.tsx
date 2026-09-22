'use client';

/**
 * @file admin/src/views/settings/change-password-card.tsx
 * @description [VIEW] Change Password Component for the Admin Portal requiring mandatory OTP verification.
 */

import { useState, useEffect } from 'react';
import {
  requestPasswordChangeOtp,
  changeAdminPasswordWithOtp,
} from '@/controllers/auth.controller';
import {
  KeyRound,
  ShieldCheck,
  Mail,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  RotateCcw,
  Terminal,
  Lock,
} from 'lucide-react';
import { Card, CardContent } from '@/views/ui/card';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';

interface ChangePasswordCardProps {
  adminEmail: string;
}

export function ChangePasswordCard({ adminEmail }: ChangePasswordCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRequestOtp = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await requestPasswordChangeOtp();
      if (res.success) {
        setOtpRequested(true);
        setResendCooldown(60);
      } else {
        setError(res.error || 'Failed to dispatch verification code.');
      }
    } catch {
      setError('An error occurred while requesting verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!otp || otp.trim().length < 6) {
      setError('Please provide the complete 6-digit OTP code.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await changeAdminPasswordWithOtp({
        otp,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        setSuccessMessage(res.message || 'Password updated successfully.');
        // Reset form
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setOtpRequested(false);
        setIsOpen(false);
      } else {
        setError(res.error || 'Failed to update password.');
      }
    } catch {
      setError('An unexpected error occurred while updating password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
      <CardContent className="p-6 space-y-5">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Administrator Password & Security</h3>
              <p className="text-xs text-slate-400">
                Update login credentials with mandatory Supabase email OTP verification
              </p>
            </div>
          </div>

          {!isOpen && (
            <Button
              onClick={() => {
                setIsOpen(true);
                setError('');
                setSuccessMessage('');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Change Password</span>
            </Button>
          )}
        </div>

        {/* Global Feedback Notifications */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Informational Status when not editing */}
        {!isOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-200 font-semibold block">OTP Verification Guard</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Password changes strictly require a one-time code sent to{' '}
                  <span className="text-slate-200 font-medium">{adminEmail}</span>.
                </p>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <Terminal className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-200 font-semibold block">Developer Console Logging</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    In local mode, the 6-digit OTP is also logged directly to your server console for convenience.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Change Password Workflow Container */}
        {isOpen && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            {!otpRequested ? (
              // Step 1: Send OTP
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Step 1: Request Security Verification Code</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      A 6-digit one-time code will be dispatched to{' '}
                      <span className="text-white font-semibold">{adminEmail}</span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/20"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <KeyRound className="h-3.5 w-3.5" />
                    )}
                    <span>Send Verification Code to Email</span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsOpen(false);
                      setError('');
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // Step 2: Form for OTP and New Password
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center justify-between">
                  <span>Verification code sent to {adminEmail}</span>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isLoading}
                    onClick={handleRequestOtp}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 disabled:opacity-50 cursor-pointer font-semibold"
                  >
                    <RotateCcw className="h-3 w-3" />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>

                {/* OTP Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Verification Code (OTP)
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
                    className="h-11 bg-slate-900 border-slate-800 text-slate-100 font-mono text-center text-lg tracking-[0.35em] font-bold focus-visible:border-blue-500"
                  />
                </div>

                {/* New Password Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      New Password (min 8 chars)
                    </label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                        className="pr-10 h-11 bg-slate-900 border-slate-800 text-slate-100 focus-visible:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                        className="pr-10 h-11 bg-slate-900 border-slate-800 text-slate-100 focus-visible:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit & Cancel Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={isLoading || otp.length < 6 || !newPassword || !confirmPassword}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/20"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    )}
                    <span>Verify OTP & Update Password</span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsOpen(false);
                      setOtpRequested(false);
                      setError('');
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
