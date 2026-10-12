import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { m } from 'framer-motion';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { institutionRequest } from '@/features/institution/services/institutions';
import { User, TestSession } from '@/entities';
import { sendEmail } from '@/utils/api';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/cn';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  User as UserIcon,
  Target,
  BookOpen,
  MessageSquare,
  Send,
  Mail,
  TrendingUp,
  PenTool,
  Headphones,
} from 'lucide-react';
import {
  NUM,
  MICRO,
  PANEL,
  Kpi,
  AdminPageHeader,
  AdminButton,
  AdminPageSkeleton,
  PILL_BASE,
  pillTone,
  STAGGER_CONTAINER,
  FADE_UP,
} from '@/components/admin/ui/primitives';

const FIELD_INPUT =
  'h-9 rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium';
const FIELD_LABEL = cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-1.5 block');

const TIER_TONE = { pro: 'accent', premium: 'accent', free: 'neutral' };

const normalizePerformanceData = (stats) => ({
  ...stats,
  recentTrend: (stats.recentTrend || []).map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString(),
  })),
});

const getModuleIcon = (module) => {
  switch (module?.toLowerCase()) {
    case 'reading':
      return BookOpen;
    case 'writing':
      return PenTool;
    case 'listening':
      return Headphones;
    case 'speaking':
      return MessageSquare;
    default:
      return Target;
  }
};

const Field = ({ label, children }) => (
  <div>
    <p className={FIELD_LABEL}>{label}</p>
    {typeof children === 'string' || typeof children === 'number' ? (
      <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">{children}</p>
    ) : (
      children
    )}
  </div>
);

export default function AdminUserDetails() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get('userId');
  const currentUserIdRef = useRef(userId);
  currentUserIdRef.current = userId;
  const historyRequestRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [testSessions, setTestSessions] = useState([]);
  const [performanceData, setPerformanceData] = useState({});
  const [historyCursor, setHistoryCursor] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const loadUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      const userData = await User.getById(userId);
      if (currentUserIdRef.current !== userId) return;

      if (!userData) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      let institutionAccess = null;
      try {
        institutionAccess = await institutionRequest('user_access', { user_id: userData.id });
      } catch {
        /* Additive rollout may not be enabled yet. */
      }
      if (currentUserIdRef.current !== userId) return;
      setUser({ ...userData, institution_access: institutionAccess?.institution_access });

      const history = await TestSession.adminHistory(userData.id);
      if (currentUserIdRef.current !== userId) return;
      setTestSessions(history.sessions);
      setHistoryCursor(history.nextCursor);
      setPerformanceData(normalizePerformanceData(history.stats));
    } catch (error) {
      if (currentUserIdRef.current !== userId) return;
      console.error('Error loading user data:', error);
      setUser(null);
    } finally {
      if (currentUserIdRef.current === userId) setIsLoading(false);
    }
  }, [userId]);

  const loadMoreHistory = async () => {
    if (!historyCursor || historyRequestRef.current) return;
    historyRequestRef.current = true;
    setHistoryLoading(true);
    try {
      const history = await TestSession.adminHistory(userId, historyCursor);
      if (currentUserIdRef.current !== userId) return;
      setTestSessions((current) => {
        const existingIds = new Set(current.map((session) => session.id));
        return [...current, ...history.sessions.filter((session) => !existingIds.has(session.id))];
      });
      setHistoryCursor(history.nextCursor);
    } catch (error) {
      if (currentUserIdRef.current !== userId) return;
      toast.error('Could not load more test history', { description: error.message });
    } finally {
      historyRequestRef.current = false;
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      navigate(createPageUrl('AdminPanel') + '?tab=users');
      return;
    }
    loadUserData();
  }, [userId, navigate, loadUserData]);

  const handleSubscriptionChange = async (newTier) => {
    try {
      await User.adminUpdateUser(userId, { subscription_tier: newTier });
      setUser((prev) => ({ ...prev, subscription_tier: newTier }));
      toast.success('Subscription tier updated');
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription tier', {
        description: error.message || 'Unknown error',
      });
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast.error('Subject and message are required');
      return;
    }

    try {
      setIsSendingEmail(true);
      await sendEmail({
        to: user.email,
        subject: emailSubject,
        content: emailBody,
        from_name: 'IELTS Ai Pro Admin',
      });

      setIsEmailDialogOpen(false);
      setEmailSubject('');
      setEmailBody('');
      toast.success('Email sent');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (isLoading) {
    return <AdminPageSkeleton kpis={3} panels={2} />;
  }

  if (!user) {
    return (
      <div className={cn(PANEL, 'p-8 text-center max-w-md mx-auto mt-12')}>
        <p className="text-sm font-extrabold text-stone-900 dark:text-stone-50">User not found</p>
        <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-1')}>
          The requested user could not be found.
        </p>
        <AdminButton
          className="mt-4"
          onClick={() => navigate(createPageUrl('AdminPanel') + '?tab=users')}
        >
          Back to user management
        </AdminButton>
      </div>
    );
  }

  return (
    <m.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-6 pt-12 md:pt-0"
    >
      <m.div variants={FADE_UP}>
        <button
          type="button"
          onClick={() => navigate(createPageUrl('AdminPanel') + '?tab=users')}
          className={cn(
            MICRO,
            'inline-flex items-center gap-1 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors mb-2 rounded px-1 -mx-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/50'
          )}
        >
          <ArrowLeft className="w-3 h-3" />
          Back to users
        </button>
        <AdminPageHeader title={user.full_name || 'User profile'} description={user.email}>
          <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
            <DialogTrigger asChild>
              <AdminButton>
                <Mail className="w-3.5 h-3.5" />
                Send email
              </AdminButton>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-[#131315] border border-stone-200/90 dark:border-white/10">
              <DialogHeader className="space-y-0.5">
                <DialogTitle className="text-base font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
                  Send email to {user.full_name || user.email}
                </DialogTitle>
                <DialogDescription className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                  Compose an email to send to this user.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <Label className={FIELD_LABEL}>Subject</Label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email subject…"
                    className={FIELD_INPUT}
                  />
                </div>
                <div>
                  <Label className={FIELD_LABEL}>Message</Label>
                  <Textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Your message…"
                    rows={6}
                    className="rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 flex-col sm:flex-row">
                <AdminButton variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
                  Cancel
                </AdminButton>
                <AdminButton onClick={handleSendEmail} loading={isSendingEmail}>
                  <Send className="w-3.5 h-3.5" />
                  {isSendingEmail ? 'Sending…' : 'Send email'}
                </AdminButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </AdminPageHeader>
        {user.institution_access && (
          <div className={cn(PANEL, 'p-3 text-xs')}>
            {user.institution_access.tier} access provided by {user.institution_access.name} ·{' '}
            {user.institution_access.status}
            <button
              className="ml-3 text-[#5a63df] underline"
              onClick={() =>
                navigate(
                  `/admin/panel?tab=institutions&institution=${user.institution_access.institution_id}`
                )
              }
            >
              Manage institution
            </button>
          </div>
        )}
      </m.div>

      <m.div variants={FADE_UP} className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Kpi label="Overall average" value={`${performanceData.overallAverage}/9.0`} />
        <Kpi label="Tests completed" value={performanceData.totalCompleted} />
        <Kpi label="Subscription" value={user.subscription_tier || 'Free'} sub="edit below" />
      </m.div>

      <m.div variants={FADE_UP} className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* User details */}
        <div className={cn(PANEL, 'p-4 space-y-3')}>
          <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400 flex items-center gap-1.5')}>
            <UserIcon className="w-3.5 h-3.5" />
            User details
          </h3>
          <Field label="Full name">{user.full_name || 'Not provided'}</Field>
          <Field label="Email">{user.email}</Field>
          <Field label="Joined">{new Date(user.created_at).toLocaleDateString()}</Field>
          <Field label="Subscription">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  PILL_BASE,
                  pillTone(TIER_TONE[user.subscription_tier?.toLowerCase()] || 'neutral')
                )}
              >
                {user.subscription_tier || 'Free'}
              </span>
              <Select
                onValueChange={handleSubscriptionChange}
                value={user.subscription_tier || 'free'}
              >
                <SelectTrigger
                  aria-label="Subscription plan"
                  className={cn(
                    FIELD_INPUT,
                    'w-28 h-8 focus-visible:ring-2 focus-visible:ring-[#5a63df]/50'
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Field>
          <Field label="Last active">
            {user.last_active ? new Date(user.last_active).toLocaleString() : 'Never'}
          </Field>
        </div>

        {/* Goals & preferences */}
        <div className={cn(PANEL, 'p-4 space-y-3')}>
          <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400 flex items-center gap-1.5')}>
            <Target className="w-3.5 h-3.5" />
            Goals & preferences
          </h3>
          <Field label="Target band score">{user.target_band_score || 'Not set'}</Field>
          <Field label="Current level">{user.current_level || 'Not set'}</Field>
          <Field label="Study hours goal">{user.study_hours_goal || 0} hours/week</Field>
          <Field label="Test date">
            {user.test_date ? new Date(user.test_date).toLocaleDateString() : 'Not set'}
          </Field>
          <Field label="Weaknesses">
            <div className="flex flex-wrap gap-1 mt-1">
              {user.weaknesses && user.weaknesses.length > 0 ? (
                user.weaknesses.map((weakness) => (
                  <span key={weakness} className={cn(PILL_BASE, pillTone('fault'))}>
                    {weakness}
                  </span>
                ))
              ) : (
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                  None specified
                </p>
              )}
            </div>
          </Field>
        </div>

        {/* Performance summary */}
        <div className={cn(PANEL, 'p-4 space-y-3')}>
          <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400 flex items-center gap-1.5')}>
            <TrendingUp className="w-3.5 h-3.5" />
            Performance summary
          </h3>
          <div className="space-y-2">
            <p className={FIELD_LABEL}>Module breakdown</p>
            {Object.entries(performanceData.moduleBreakdown || {}).length > 0 ? (
              Object.entries(performanceData.moduleBreakdown).map(([module, data]) => {
                const ModuleIcon = getModuleIcon(module);
                return (
                  <div
                    key={module}
                    className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-white/3 border border-stone-200/70 dark:border-white/6"
                  >
                    <div className="flex items-center gap-2">
                      <ModuleIcon className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-100 capitalize">
                        {module}
                      </span>
                    </div>
                    <span
                      className={cn(NUM, 'text-xs font-bold text-stone-800 dark:text-stone-100')}
                    >
                      {data.average.toFixed(1)}/9.0
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                No tests completed yet.
              </p>
            )}
          </div>
        </div>
      </m.div>

      {/* Performance trend chart */}
      {performanceData.recentTrend && performanceData.recentTrend.length > 0 && (
        <m.div variants={FADE_UP} className={cn(PANEL, 'p-4')}>
          <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-3')}>
            Recent performance trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData.recentTrend}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5a63df" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#5a63df" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-stone-200 dark:stroke-white/10"
                />
                <XAxis
                  dataKey="session"
                  className="fill-stone-500 dark:fill-stone-400"
                  fontSize={11}
                />
                <YAxis
                  domain={[0, 9]}
                  className="fill-stone-500 dark:fill-stone-400"
                  fontSize={11}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tw-prose-body, #131315)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#5a63df"
                  strokeWidth={2}
                  fill="url(#scoreGradient)"
                  dot={{ fill: '#5a63df', strokeWidth: 2, r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </m.div>
      )}

      {/* Test history */}
      <m.div variants={FADE_UP} className={cn(PANEL, 'overflow-hidden')}>
        <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400 p-4 pb-0')}>Test history</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 dark:border-white/[0.07]">
                {['Test type', 'Score', 'Completed', 'Status'].map((h) => (
                  <th
                    key={h}
                    className={cn(MICRO, 'px-4 py-3 text-stone-500 dark:text-stone-400 font-bold')}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-white/5">
              {testSessions.length > 0 ? (
                testSessions.map((session) => (
                  <tr key={session.id}>
                    <td className="px-4 py-3 text-xs font-bold text-stone-800 dark:text-stone-100 capitalize">
                      {session.test_type}
                    </td>
                    <td className={cn(NUM, 'px-4 py-3 text-xs text-stone-800 dark:text-stone-100')}>
                      {session.score ? `${session.score}/9.0` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">
                      {session.completed_at
                        ? new Date(session.completed_at).toLocaleDateString()
                        : 'In progress'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(PILL_BASE, pillTone(session.is_completed ? 'ok' : 'warn'))}
                      >
                        {session.is_completed ? 'Completed' : 'In progress'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-4 py-10 text-center">
                    <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                      No tests completed yet.
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {historyCursor && (
          <div className="p-4 border-t border-stone-200 dark:border-white/[0.07]">
            <AdminButton onClick={loadMoreHistory} disabled={historyLoading}>
              {historyLoading ? 'Loading history…' : 'Load more tests'}
            </AdminButton>
          </div>
        )}
      </m.div>
    </m.div>
  );
}
