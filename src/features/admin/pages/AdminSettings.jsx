import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Mail,
  Lock,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createPageUrl } from '@/utils';

export default function AdminSettings() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    currentPassword: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate(createPageUrl('Dashboard'));
    }
  }, [isAdmin, navigate]);

  const clearMessages = () => {
    setSuccess('');
    setError('');
  };

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!emailForm.newEmail.trim() || !emailForm.currentPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (!emailForm.newEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Verify current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: emailForm.currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update email
      const { error: updateError } = await supabase.auth.updateUser({
        email: emailForm.newEmail,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess('Email updated successfully! Please check your new email for confirmation.');
      setEmailForm({ newEmail: '', currentPassword: '' });

      // Sign out after email change for security
      setTimeout(() => {
        signOut();
        navigate(createPageUrl('AdminLogin'));
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    clearMessages();

    if (
      !passwordForm.currentPassword.trim() ||
      !passwordForm.newPassword.trim() ||
      !passwordForm.confirmPassword.trim()
    ) {
      setError('Please fill in all fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      // Verify current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordForm.currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess('Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-indigo-950/20 p-4"
      data-oid="ixaakr_"
    >
      <div className="max-w-4xl mx-auto" data-oid="4t96q0r">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
          data-oid="hd855eb"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('AdminPanel'))}
            className="mb-4 text-muted-foreground hover:text-foreground"
            data-oid="d0h_:2a"
          >
            <ArrowLeft className="w-4 h-4 mr-2" data-oid="ixio933" />
            Back to Admin Panel
          </Button>

          <div className="flex items-center gap-3 mb-2" data-oid="q3h4._s">
            <div
              className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center"
              data-oid="kqeb1dg"
            >
              <Settings className="w-6 h-6 text-white" data-oid="qr806hm" />
            </div>
            <div data-oid="clb88m9">
              <h1 className="text-3xl font-bold text-foreground" data-oid="lu.vegt">
                Admin Settings
              </h1>
              <p className="text-muted-foreground" data-oid="ch8q:fk">
                Manage your admin account credentials
              </p>
            </div>
          </div>
        </motion.div>

        {/* Alerts */}
        {success && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
            data-oid="w:0jku8"
          >
            <Alert
              className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
              data-oid="qon.zkt"
            >
              <CheckCircle
                className="w-4 h-4 text-green-600 dark:text-green-400"
                data-oid="beuoj2l"
              />

              <AlertDescription className="text-green-700 dark:text-green-300" data-oid="tmyngpx">
                {success}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
            data-oid="701brxi"
          >
            <Alert
              className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
              data-oid="c3tgtn:"
            >
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" data-oid="5j70k85" />
              <AlertDescription className="text-red-700 dark:text-red-300" data-oid="14fsv9r">
                {error}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <div className="grid gap-6 md:grid-cols-2" data-oid="axt:325">
          {/* Email Update Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            data-oid="cjei3q-"
          >
            <Card data-oid="so1zlso">
              <CardHeader data-oid="83qbq6e">
                <CardTitle className="flex items-center gap-2" data-oid="d--.di.">
                  <Mail className="w-5 h-5" data-oid="v:4q5ze" />
                  Update Email
                </CardTitle>
                <CardDescription data-oid="-v.q8:4">
                  Change your admin email address. You'll need to verify the new email.
                </CardDescription>
              </CardHeader>
              <CardContent data-oid="bwfn0a1">
                <form onSubmit={handleEmailUpdate} className="space-y-4" data-oid="qgeko3p">
                  <div className="space-y-2" data-oid="9cbqn3r">
                    <Label htmlFor="current-email" data-oid="e2gsjim">
                      Current Email
                    </Label>
                    <Input
                      id="current-email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                      data-oid="li0pl9x"
                    />
                  </div>

                  <div className="space-y-2" data-oid="e:h.sx2">
                    <Label htmlFor="new-email" data-oid="fn26vo9">
                      New Email
                    </Label>
                    <Input
                      id="new-email"
                      type="email"
                      placeholder="Enter new email address"
                      value={emailForm.newEmail}
                      onChange={(e) =>
                        setEmailForm((prev) => ({ ...prev, newEmail: e.target.value }))
                      }
                      required
                      data-oid="aku3gx7"
                    />
                  </div>

                  <div className="space-y-2" data-oid="5gp-b.3">
                    <Label htmlFor="email-current-password" data-oid="kebckg3">
                      Current Password
                    </Label>
                    <div className="relative" data-oid="96it8z-">
                      <Input
                        id="email-current-password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="Enter current password"
                        value={emailForm.currentPassword}
                        onChange={(e) =>
                          setEmailForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                        }
                        className="pr-10"
                        required
                        data-oid="n-_l9.o"
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        data-oid="qjy8ss:"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" data-oid=".onhp0z" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" data-oid="o.aou2-" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full" data-oid="rhr.1ci">
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 mr-2"
                          data-oid="urkc-8a"
                        >
                          <Settings className="w-4 h-4" data-oid="9zlsoz." />
                        </motion.div>
                        Updating Email...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" data-oid="2290r6r" />
                        Update Email
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Password Update Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            data-oid="pkktr0l"
          >
            <Card data-oid=".9cme5-">
              <CardHeader data-oid=".z5yaob">
                <CardTitle className="flex items-center gap-2" data-oid="5fw22nh">
                  <Lock className="w-5 h-5" data-oid="tx43-lt" />
                  Update Password
                </CardTitle>
                <CardDescription data-oid="isyh_zi">
                  Change your admin password. Use a strong password for security.
                </CardDescription>
              </CardHeader>
              <CardContent data-oid="r36pzjv">
                <form onSubmit={handlePasswordUpdate} className="space-y-4" data-oid=".3m7kz8">
                  <div className="space-y-2" data-oid="a5kjs7w">
                    <Label htmlFor="password-current-password" data-oid="3lafm5j">
                      Current Password
                    </Label>
                    <div className="relative" data-oid="48j5hw1">
                      <Input
                        id="password-current-password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="Enter current password"
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                        }
                        className="pr-10"
                        required
                        data-oid="eirh:8."
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        data-oid="v0efomf"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" data-oid="qyt6:2k" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" data-oid="6nfp.04" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2" data-oid="o6hr.c_">
                    <Label htmlFor="new-password" data-oid="yy4y-mv">
                      New Password
                    </Label>
                    <div className="relative" data-oid="rfh:ipu">
                      <Input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Enter new password (min 6 characters)"
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                        }
                        className="pr-10"
                        required
                        minLength={6}
                        data-oid="gynok_q"
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        data-oid="d5sgaef"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" data-oid="tbtly1e" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" data-oid="ekid:78" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2" data-oid="bxifycb">
                    <Label htmlFor="confirm-password" data-oid="9s22zr0">
                      Confirm New Password
                    </Label>
                    <div className="relative" data-oid=":mifqwk">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                        }
                        className="pr-10"
                        required
                        data-oid="i4h03bf"
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        data-oid="go:9shj"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" data-oid="5lkx_wh" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" data-oid="ztud66s" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full" data-oid="dyu7mxc">
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 mr-2"
                          data-oid="8k5g4bj"
                        >
                          <Settings className="w-4 h-4" data-oid="d9sf82-" />
                        </motion.div>
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" data-oid="f.3vkc8" />
                        Update Password
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
          data-oid="vbnbazm"
        >
          <Card
            className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
            data-oid="w64f6gy"
          >
            <CardContent className="pt-6" data-oid="1krxtj_">
              <div className="flex items-start gap-3" data-oid="8fj_.qe">
                <AlertCircle
                  className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5"
                  data-oid="-j7q71e"
                />

                <div data-oid="ils91xh">
                  <h3
                    className="font-semibold text-amber-800 dark:text-amber-200 mb-2"
                    data-oid="7p4scc7"
                  >
                    Security Notice
                  </h3>
                  <ul
                    className="text-sm text-amber-700 dark:text-amber-300 space-y-1"
                    data-oid="i2lh6li"
                  >
                    <li data-oid="mbwmydb">
                      • Changing your email will require verification and you'll be signed out
                    </li>
                    <li data-oid="24o:prf">• Use a strong password with at least 6 characters</li>
                    <li data-oid="9l0mou5">
                      • Keep your admin credentials secure and don't share them
                    </li>
                    <li data-oid="_cu_-cx">
                      • Consider using a password manager for better security
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
