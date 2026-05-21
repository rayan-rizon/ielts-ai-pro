import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, ArrowLeft, CheckCircle2, Mail, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/features/auth/services/User';
import { validateField, emailSchema } from '@/lib/validations';
import { cn } from '@/lib/cn';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState(false);
  const [fieldError, setFieldError] = useState(null);

  const validate = (value) => {
    const result = validateField(emailSchema, value);
    setFieldError(result.error);
    return result.valid;
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (touched) validate(value);
  };

  const handleBlur = () => {
    setTouched(true);
    validate(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate(email)) return;

    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      await User.resetPasswordForEmail(email);
      setSuccess(true);
    } catch (err) {
      console.error('Password reset request failed:', err);
      // For security reasons, often generic messages are better, but for UX we might want to be specific
      if (err.message.includes('check your email')) {
        // Supabase sometimes returns this as an error message for rate limiting or other soft errors
        setSuccess(true);
      } else {
        setError(err.message || 'Failed to send reset link. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden font-sans"
      data-oid="jz59unm"
    >
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" data-oid="p8_wsb-">
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"
          data-oid="avw1-ly"
        ></div>
        <div
          className="absolute -top-[20%] -right-[10%] w-[70vh] h-[70vh] rounded-full bg-blue-500/10 blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse"
          data-oid="t33g.1p"
        />

        <div
          className="absolute top-[20%] -left-[10%] w-[50vh] h-[50vh] rounded-full bg-indigo-500/10 blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse delay-1000"
          data-oid="tp0ov67"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
        data-oid="iqz9oek"
      >
        <Link
          to={createPageUrl('Login')}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors mb-6 group"
          data-oid="aymn5ah"
        >
          <ArrowLeft
            className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
            data-oid="7nva.56"
          />
          Back to login
        </Link>

        <Card className="glass-card shadow-2xl overflow-hidden" data-oid="1c.krmt">
          <CardHeader className="text-center pb-6" data-oid="zqnggmu">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-600/20"
              data-oid="27uba-v"
            >
              <Mail className="w-8 h-8 text-white" data-oid="k:pyb28" />
            </motion.div>
            <CardTitle
              className="text-3xl font-black text-slate-900 dark:text-white"
              data-oid="wb75q7w"
            >
              Forgot Password?
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 mt-2" data-oid="0v--19p">
              No worries! Enter your email and we'll send you reset instructions.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2" data-oid="tu0slua">
            <AnimatePresence mode="wait" data-oid="7mdnhqb">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 text-center"
                  data-oid="qxu3ixq"
                >
                  <div
                    className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 p-6 rounded-2xl flex flex-col items-center gap-3"
                    data-oid="e214025"
                  >
                    <CheckCircle2 className="w-12 h-12" data-oid="7p1lkt7" />
                    <div className="space-y-1" data-oid="y1o4rw8">
                      <p className="font-bold text-lg" data-oid="xeo2v:a">
                        Email Sent!
                      </p>
                      <p
                        className="text-sm opacity-90 leading-relaxed text-slate-600 dark:text-slate-400"
                        data-oid="8rf-fy6"
                      >
                        We've sent a password reset link to <br data-oid="b4yn.c_" />
                        <span
                          className="font-bold text-slate-900 dark:text-white underline decoration-green-500/30"
                          data-oid="veecz93"
                        >
                          {email}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4" data-oid="f:gdy_x">
                    <p className="text-xs text-slate-500 dark:text-slate-400" data-oid="50e0wx:">
                      Didn't receive the email? Check your spam folder or
                    </p>
                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full h-11 rounded-xl border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 font-bold"
                      data-oid="j3mv8ct"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" data-oid="muahu4_" />
                      ) : (
                        'Resend Reset Link'
                      )}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" key="form" data-oid="t1sqbr6">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      role="alert"
                      className="p-4 text-xs font-bold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2"
                      data-oid="1k.0qyl"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" data-oid="avdh0.y" />
                      {error}
                    </motion.div>
                  )}

                  <div
                    className="space-y-1.5 focus-within:text-blue-600 transition-colors"
                    data-oid="qe_n-nb"
                  >
                    <Label
                      htmlFor="email"
                      className="text-[10px] font-black uppercase tracking-widest ml-1"
                      data-oid="epf4ccz"
                    >
                      Email Address
                    </Label>
                    <div className="relative" data-oid="syhugb_">
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={cn(
                          'pl-11 h-12 bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:ring-blue-500/20 rounded-xl transition-all',
                          touched &&
                            fieldError &&
                            'border-destructive focus-visible:ring-destructive'
                        )}
                        autoComplete="email"
                        disabled={isLoading}
                        required
                        data-oid="c47vgy:"
                      />

                      <Mail
                        className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"
                        data-oid="ji.vvbs"
                      />
                    </div>
                    {touched && fieldError && (
                      <p
                        role="alert"
                        className="text-[10px] font-bold text-destructive ml-1"
                        data-oid="yya3.df"
                      >
                        {fieldError}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !email || !!fieldError}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    data-oid="3ymnkwf"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" data-oid="18leo7a" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>

                  <div className="flex items-center justify-center pt-2" data-oid="96octry">
                    <Sparkles className="w-3 h-3 text-blue-500 mr-2" data-oid="14538he" />
                    <span
                      className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter"
                      data-oid="bamyliv"
                    >
                      Powered by IELTS Ai Pro AI
                    </span>
                  </div>
                </form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
