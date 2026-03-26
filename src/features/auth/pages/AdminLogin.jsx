import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Loader2, AlertCircle, Eye, EyeOff, Mail, ArrowLeft, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();
  const { user, signIn, isAdmin, loading, checkIsAdmin } = useAuth();

  // No longer hardcoded - relies on DB role via isAdmin from AuthContext

  useEffect(() => {
    // Only redirect once loading is finished and we have a definitive auth state
    // AND we are not currently in the process of a manual login (which handles its own redirect)
    if (!loading && user && !isLoggingIn) {
      if (isAdmin) {
        // Validated admin from database - allow access
        navigate(createPageUrl('AdminPanel'));
      } else {
        // User logged in but NOT an admin - redirect to user dashboard
        navigate(createPageUrl('Dashboard'));
      }
    }
  }, [user, isAdmin, navigate, loading, isLoggingIn]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setIsLoggingIn(true); // Prevent useEffect redirect
    try {
      const signedInUser = await signIn(email, password);

      // Explicitly check admin status for the new user locally
      // This avoids the race condition where the context might lag
      const isUserAdmin = await checkIsAdmin(signedInUser.id);

      if (isUserAdmin) {
        navigate(createPageUrl('AdminPanel'));
      } else {
        setError('Access denied. You do not have administrator privileges.');
        // Optional: redirect to dashboard or just show error and sign out?
        // Usually safer to just verify here. If they are just a user trying to hack entry, stay here.
        // If legitimate user, maybe redirect.
        // Let's redirect to dashboard if they are a valid user but not admin
        navigate(createPageUrl('Dashboard'));
      }
    } catch (err) {
      console.error('Admin sign-in failed:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
      setIsLoading(false);
      setIsLoggingIn(false); // Re-enable useEffect checks (though we probably failed anyway)
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden font-sans"
      data-oid="iw8q45n"
    >
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" data-oid="t4v:f43">
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"
          data-oid="o:708-2"
        ></div>
        <div
          className="absolute -top-[20%] -right-[10%] w-[70vh] h-[70vh] rounded-full bg-red-500/10 blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse"
          data-oid="k.1-9se"
        />

        <div
          className="absolute top-[20%] -left-[10%] w-[50vh] h-[50vh] rounded-full bg-orange-500/10 blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse delay-1000"
          data-oid=":j:e5no"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
        data-oid="696cvjl"
      >
        {/* Back to Home */}
        <Link
          to={createPageUrl('Index')}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors mb-6 group"
          data-oid="d8gz8vc"
        >
          <ArrowLeft
            className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
            data-oid="zupq7ky"
          />
          Back to home
        </Link>

        <Card
          className="glass-card border-red-500/20 shadow-2xl overflow-hidden"
          data-oid="4ya:7w_"
        >
          <CardHeader
            className="text-center pb-8 border-b border-slate-100 dark:border-white/5 bg-red-500/5"
            data-oid="o5mzr30"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-red-500/20"
              data-oid="cmtlqpa"
            >
              <Shield className="w-8 h-8 text-white" data-oid="mu54v1x" />
            </motion.div>
            <CardTitle
              className="text-3xl font-black text-slate-900 dark:text-white"
              data-oid="3o.nr3x"
            >
              Admin Access
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 mt-2" data-oid="4vi64kw">
              Authentication required for system management
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-8" data-oid=".k9wttd">
            <AnimatePresence mode="wait" data-oid="i6:9par">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-destructive text-xs font-bold bg-destructive/10 p-4 rounded-xl border border-destructive/20"
                  data-oid="7zze2c-"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" data-oid="p4.fri1" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-5" data-oid=".otl2sq">
              <div
                className="space-y-1.5 focus-within:text-red-600 transition-colors"
                data-oid="qgk0:na"
              >
                <Label
                  htmlFor="email"
                  className="text-[10px] font-black uppercase tracking-widest ml-1"
                  data-oid="zgivt-o"
                >
                  Admin Email
                </Label>
                <div className="relative" data-oid="a6u.yjr">
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@ieltsai.pro"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:ring-red-500/20 rounded-xl transition-all"
                    autoComplete="email"
                    data-oid="dpc2i50"
                  />

                  <Mail
                    className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"
                    data-oid="cg-_afw"
                  />
                </div>
              </div>

              <div
                className="space-y-1.5 focus-within:text-red-600 transition-colors"
                data-oid="pom2q.4"
              >
                <Label
                  htmlFor="password"
                  title="password"
                  className="text-[10px] font-black uppercase tracking-widest ml-1"
                  data-oid="sryvhm3"
                >
                  Access Password
                </Label>
                <div className="relative" data-oid="w5jcx07">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-11 h-12 bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:ring-red-500/20 rounded-xl transition-all"
                    autoComplete="current-password"
                    data-oid="9g-e7lo"
                  />

                  <Lock
                    className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"
                    data-oid="rjq794t"
                  />

                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    data-oid="5au2s18"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" data-oid="2t10rj8" />
                    ) : (
                      <Eye className="w-4 h-4" data-oid="q74h3-h" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email.trim() || !password.trim()}
                className="w-full h-12 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-black rounded-xl shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                data-oid="j74tubc"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" data-oid="dljqh_v" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" data-oid=":5x2jor" />
                    Enter Command Center
                  </>
                )}
              </Button>
            </form>

            <div
              className="bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10"
              data-oid="9_aed-3"
            >
              <p
                className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed text-center italic"
                data-oid="dkysza9"
              >
                Authorized Personnel Only. All access attempts are logged and monitored.
              </p>
            </div>
          </CardContent>
        </Card>

        <p
          className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-8"
          data-oid="t2g-oaw"
        >
          © 2026 IELTS Ai Pro • Admin Interface v2.0
        </p>
      </motion.div>
    </div>
  );
}
