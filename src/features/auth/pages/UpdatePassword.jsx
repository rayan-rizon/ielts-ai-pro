import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/features/auth/services/User';
import { getPasswordStrength, validateField, signUpSchema } from '@/lib/validations';
import { cn } from '@/lib/cn';
import { IconChip, MICRO, PANEL, TITLE, WELL } from '@/features/dashboard/components/primitives';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  // Password strength logic
  const passwordStrength = getPasswordStrength(password);

  // Validation
  const getValidationError = () => {
    // 1. Check complex password rules using the password part of signUpSchema
    const passwordOnlySchema = signUpSchema.shape.password;
    const result = validateField(passwordOnlySchema, password);
    if (result.error) return result.error;

    // 2. Check matching
    if (confirmPassword && password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const validationError = getValidationError();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await User.updatePassword(password);
      setSuccess(true);
      // Wait a moment then redirect to login
      setTimeout(() => {
        navigate(createPageUrl('Login'));
      }, 3000);
    } catch (err) {
      console.error('Password update failed:', err);
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#f7f6fd] dark:bg-[#09090c] flex items-center justify-center p-4 font-sans"
      data-oid=".-uqxau"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
        data-oid="eysafyz"
      >
        <Link
          to={createPageUrl('Login')}
          className={cn(
            MICRO,
            'inline-flex items-center gap-2 text-slate-500 hover:text-[#5a63df] dark:text-slate-400 dark:hover:text-[#afb5ff] transition-colors mb-4 group'
          )}
          data-oid="pjm48ps"
        >
          <ArrowLeft
            className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
            data-oid="c.ev6y5"
          />
          Back to login
        </Link>

        <section className={cn(PANEL, 'p-6 sm:p-7')} data-oid="m.zrx.u">
          <header className="text-center pb-6" data-oid="8n4l3bw">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto mb-4"
              data-oid="-g3fxrf"
            >
              <IconChip
                icon={Lock}
                tone="accent"
                size="md"
                className="h-12 w-12 rounded-xl"
                data-oid="97ae097"
              />
            </motion.div>
            <h1 className={cn(TITLE, 'text-2xl')} data-oid="wdnfkm8">
              New Password
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2" data-oid="rtyot5q">
              Set a strong password to protect your account.
            </p>
          </header>

          <div className="pt-2" data-oid="21sk1o.">
            <AnimatePresence mode="wait" data-oid="itzff66">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 text-center"
                  data-oid="pc4dgh0"
                >
                  <div
                    className={cn(
                      WELL,
                      'border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 p-5 rounded-lg flex flex-col items-center gap-3'
                    )}
                    data-oid="4jf8tw9"
                  >
                    <CheckCircle2 className="w-12 h-12" data-oid="qb54fkh" />
                    <div className="space-y-1" data-oid="iia:ppj">
                      <p className="font-bold text-lg" data-oid="r8wyw39">
                        Success!
                      </p>
                      <p
                        className="text-sm opacity-90 leading-relaxed text-slate-600 dark:text-slate-400"
                        data-oid="npk0v21"
                      >
                        Your password has been updated successfully. <br data-oid="hybf7yh" />
                        <span
                          className="font-bold text-slate-900 dark:text-white underline decoration-green-500/30"
                          data-oid="chlps31"
                        >
                          Redirecting to login...
                        </span>
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate(createPageUrl('Login'))}
                    className="w-full h-11 bg-[#5a63df] hover:bg-[#4c55c9] text-white font-bold rounded-lg"
                    data-oid="pbheze-"
                  >
                    Return to Login
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" key="form" data-oid="a:-w_v8">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      role="alert"
                      className="p-4 text-xs font-bold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2"
                      data-oid="jb.:euy"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" data-oid="x7f6ild" />
                      {error}
                    </motion.div>
                  )}

                  <div className="space-y-4" data-oid="zmdeny4">
                    <div
                      className="space-y-1.5 focus-within:text-blue-600 transition-colors"
                      data-oid="3:2sbik"
                    >
                      <Label
                        htmlFor="password"
                        title="password"
                        className="text-[10px] font-black uppercase tracking-widest ml-1"
                        data-oid=":qdwyzf"
                      >
                        New Password
                      </Label>
                      <div className="relative" data-oid="xmsl9s1">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-11 pr-11 h-12 bg-white dark:bg-[#131315] border-[#e4e2f0] dark:border-white/10 focus:ring-[#5a63df]/20 rounded-lg transition-all"
                          required
                          data-oid="3.4uiml"
                        />

                        <Lock
                          className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"
                          data-oid="u8jx-6y"
                        />

                        <button
                          type="button"
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                          data-oid="mt-k416"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" data-oid="2:-ugus" />
                          ) : (
                            <Eye className="w-4 h-4" data-oid="-fuwjad" />
                          )}
                        </button>
                      </div>

                      {password && (
                        <div className="space-y-1.5 px-1 pt-1" data-oid=":2u8koj">
                          <div className="flex gap-1" data-oid="5:y-5mo">
                            {[0, 1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className={cn(
                                  'h-1 flex-1 rounded-full transition-all duration-500',
                                  i <= passwordStrength.score
                                    ? passwordStrength.color
                                    : 'bg-slate-200 dark:bg-white/10'
                                )}
                                data-oid=":u.jdsc"
                              />
                            ))}
                          </div>
                          <div
                            className="flex justify-between items-center text-[10px] font-medium text-slate-500"
                            data-oid="20c33uk"
                          >
                            <span data-oid="gbd8p4q">Security: {passwordStrength.label}</span>
                            <span data-oid="umrgp.k">Min 8 characters</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      className="space-y-1.5 focus-within:text-blue-600 transition-colors"
                      data-oid="7.:eco:"
                    >
                      <Label
                        htmlFor="confirmPassword"
                        title="confirmPassword"
                        className="text-[10px] font-black uppercase tracking-widest ml-1"
                        data-oid="55c649k"
                      >
                        Confirm Password
                      </Label>
                      <div className="relative" data-oid="xe:hx2e">
                        <Input
                          id="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-11 h-12 bg-white dark:bg-[#131315] border-[#e4e2f0] dark:border-white/10 focus:ring-[#5a63df]/20 rounded-lg transition-all"
                          required
                          data-oid="j_26ir_"
                        />

                        <Lock
                          className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"
                          data-oid="h9uflyi"
                        />
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p
                          role="alert"
                          className="text-[10px] font-bold text-destructive ml-1"
                          data-oid="21oxh0v"
                        >
                          Passwords do not match
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !password || !!validationError}
                    className="w-full h-12 bg-[#5a63df] hover:bg-[#4c55c9] text-white font-black rounded-lg active:scale-[0.99] transition-colors duration-200"
                    data-oid="e_o3x6n"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" data-oid="kaoe.1:" />
                        Setting password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>

                  <div className="flex items-center justify-center pt-2" data-oid="_orpamm">
                    <Sparkles className="w-3 h-3 text-blue-500 mr-2" data-oid="x7.viuc" />
                    <span
                      className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter"
                      data-oid="c2bf-hq"
                    >
                      Powered by IELTS Ai Pro AI
                    </span>
                  </div>
                </form>
              )}
            </AnimatePresence>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
