import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, TestSession } from '@/entities';
import { sendEmail } from '@/utils/api';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  User as UserIcon,
  Target,
  BookOpen,
  MessageSquare,
  Send,
  Loader2,
  Mail,
  TrendingUp,
  PenTool,
  Headphones,
} from 'lucide-react';
import { m } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const calculatePerformanceData = (sessions) => {
  const completedSessions = sessions.filter((session) => session.is_completed && session.score);
  if (completedSessions.length === 0) {
    return { overallAverage: 0, totalCompleted: 0, moduleBreakdown: {}, recentTrend: [] };
  }

  const overallAverage =
    completedSessions.reduce((total, session) => total + session.score, 0) /
    completedSessions.length;
  const moduleBreakdown = completedSessions.reduce((breakdown, session) => {
    const module = session.test_type;
    if (!breakdown[module]) breakdown[module] = { scores: [], total: 0, best: 0 };
    breakdown[module].scores.push(session.score);
    breakdown[module].total += 1;
    breakdown[module].best = Math.max(breakdown[module].best, session.score);
    return breakdown;
  }, {});

  Object.values(moduleBreakdown).forEach((module) => {
    module.average =
      module.scores.reduce((total, score) => total + score, 0) / module.scores.length;
  });
  const recentTrend = [...completedSessions]
    .sort((left, right) => new Date(right.completed_at) - new Date(left.completed_at))
    .slice(0, 10)
    .reverse()
    .map((session, index) => ({
      session: index + 1,
      score: session.score,
      date: new Date(session.completed_at).toLocaleDateString(),
      module: session.test_type,
    }));

  return {
    overallAverage: overallAverage.toFixed(1),
    totalCompleted: completedSessions.length,
    moduleBreakdown,
    recentTrend,
  };
};

export default function AdminUserDetails() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get('userId');

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [testSessions, setTestSessions] = useState([]);
  const [performanceData, setPerformanceData] = useState({});

  // Email dialog state
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const loadUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      const userData = await User.getById(userId);

      if (!userData) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      setUser(userData);

      const sessions = await TestSession.list({ user_id: userData.id });
      setTestSessions(sessions);

      setPerformanceData(calculatePerformanceData(sessions));
    } catch (error) {
      console.error('Error loading user data:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      navigate(createPageUrl('AdminPanel') + '?tab=users');
      return;
    }
    loadUserData();
  }, [userId, navigate, loadUserData]);

  const handleSubscriptionChange = async (newTier) => {
    try {
      // Use adminUpdateUser to call Edge Function with service role permissions
      await User.adminUpdateUser(userId, { subscription_tier: newTier });
      setUser((prev) => ({ ...prev, subscription_tier: newTier }));
      alert('Subscription tier updated successfully!');
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription tier: ' + (error.message || 'Unknown error'));
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      alert('Please fill in both subject and message');
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
      alert('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getSubscriptionColor = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'pro':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'premium':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

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

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        data-oid="nd_ytol"
      >
        <div className="text-center" data-oid="bz0oj8.">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" data-oid="u5hmwa4" />
          <p className="text-muted-foreground" data-oid="pcmzds9">
            Loading user details...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        data-oid="i7kb_5q"
      >
        <Card className="bg-card border p-8 text-center" data-oid="nk5h6_f">
          <h2 className="text-xl font-semibold text-foreground mb-2" data-oid="ru32hr4">
            User Not Found
          </h2>
          <p className="text-muted-foreground mb-4" data-oid="m527ymq">
            The requested user could not be found.
          </p>
          <Button
            onClick={() => navigate(createPageUrl('AdminPanel') + '?tab=users')}
            data-oid="6vs2cm4"
          >
            Back to User Management
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-oid="d2i-xvb">
      <div className="p-6 md:p-8" data-oid="bwtu0.2">
        <div className="max-w-7xl mx-auto space-y-8" data-oid=".j20ayb">
          {/* Header */}
          <m.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            data-oid="k2fnuvg"
          >
            <div className="flex items-center gap-4" data-oid="m4h9_e_">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(createPageUrl('AdminPanel') + '?tab=users')}
                className="hover:bg-muted"
                data-oid="mvxdf6a"
              >
                <ArrowLeft className="w-5 h-5" data-oid="45r:.x-" />
              </Button>
              <div
                className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"
                data-oid="14u1d9i"
              >
                <UserIcon className="w-8 h-8 text-white" data-oid="zzzfj7d" />
              </div>
              <div data-oid="bfgf9ky">
                <h1 className="text-3xl font-bold text-foreground" data-oid="41q0x94">
                  {user.full_name || 'User Profile'}
                </h1>
                <p className="text-muted-foreground" data-oid="os0m31l">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex gap-3" data-oid="v.iq-4o">
              <Dialog
                open={isEmailDialogOpen}
                onOpenChange={setIsEmailDialogOpen}
                data-oid="iysss.g"
              >
                <DialogTrigger asChild data-oid=".o0es4-">
                  <Button className="bg-primary hover:bg-primary/90" data-oid="ojtepst">
                    <Mail className="w-4 h-4 mr-2" data-oid="359vq:x" />
                    Send Email
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border" data-oid="r8613wx">
                  <DialogHeader data-oid="p71hy11">
                    <DialogTitle className="text-foreground" data-oid="gtrg-hh">
                      Send Email to {user.full_name || user.email}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground" data-oid="3a65icu">
                      Compose an email to send to this user.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4" data-oid="8hsecmi">
                    <div data-oid="30b6h42">
                      <Label className="text-foreground" data-oid="58k9:r4">
                        Subject
                      </Label>
                      <Input
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Email subject..."
                        className="bg-input border text-foreground"
                        data-oid="sgrom1f"
                      />
                    </div>
                    <div data-oid="47_rhed">
                      <Label className="text-foreground" data-oid="0hmma2v">
                        Message
                      </Label>
                      <Textarea
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        placeholder="Your message..."
                        rows={6}
                        className="bg-input border text-foreground"
                        data-oid="41f0u3e"
                      />
                    </div>
                  </div>
                  <DialogFooter data-oid="vz.ie9i">
                    <Button
                      variant="outline"
                      onClick={() => setIsEmailDialogOpen(false)}
                      data-oid="kvcmbm2"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSendEmail} disabled={isSendingEmail} data-oid=":k73pe3">
                      {isSendingEmail ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" data-oid="2kbgf-7" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" data-oid="_whs39a" />
                          Send Email
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </m.div>

          {/* Main Content */}
          <div className="space-y-8" data-oid="geh6gq.">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              data-oid="rn3-z5l"
            >
              {/* User Details Card */}
              <Card className="bg-card border shadow-lg" data-oid="_7_5cvg">
                <CardHeader
                  className="flex flex-row items-center space-y-0 pb-2"
                  data-oid="dg4wsg7"
                >
                  <UserIcon className="w-5 h-5 text-primary mr-2" data-oid="p_6atzq" />
                  <CardTitle className="text-lg text-foreground" data-oid="x6r_1dl">
                    User Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4" data-oid="2s-ahfd">
                  <div data-oid="di-0wr8">
                    <Label className="text-sm font-medium text-muted-foreground" data-oid="b-3ghvd">
                      Full Name
                    </Label>
                    <p className="text-foreground" data-oid="gzwrmm5">
                      {user.full_name || 'Not provided'}
                    </p>
                  </div>
                  <div data-oid="khgs05g">
                    <Label className="text-sm font-medium text-muted-foreground" data-oid="gqvqw2t">
                      Email
                    </Label>
                    <p className="text-foreground" data-oid="w7.-csz">
                      {user.email}
                    </p>
                  </div>
                  <div data-oid="rqhhukq">
                    <Label className="text-sm font-medium text-muted-foreground" data-oid="qwxxr:m">
                      Joined
                    </Label>
                    <p className="text-foreground" data-oid=":mx9dy1">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div data-oid=".dwws0b">
                    <Label className="text-sm font-medium text-muted-foreground" data-oid="-rz939_">
                      Subscription
                    </Label>
                    <div className="flex items-center gap-2 mt-1" data-oid="5_ne433">
                      <Badge
                        className={getSubscriptionColor(user.subscription_tier)}
                        data-oid="4y4k8im"
                      >
                        {user.subscription_tier || 'Free'}
                      </Badge>
                      <Select
                        onValueChange={handleSubscriptionChange}
                        value={user.subscription_tier || 'free'}
                        data-oid="o878g-m"
                      >
                        <SelectTrigger className="w-28 h-8 bg-input border" data-oid="b.ulw72">
                          <SelectValue data-oid="b4xzlxw" />
                        </SelectTrigger>
                        <SelectContent data-oid="yjso0gh">
                          <SelectItem value="free" data-oid="rhzutjt">
                            Free
                          </SelectItem>
                          <SelectItem value="pro" data-oid=":yhjmdo">
                            Pro
                          </SelectItem>
                          <SelectItem value="premium" data-oid="xo5rxq7">
                            Premium
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div data-oid="09jcyz2">
                    <Label className="text-sm font-medium text-muted-foreground" data-oid="77.p8sh">
                      Last Active
                    </Label>
                    <p className="text-foreground" data-oid="8bjs3:c">
                      {user.last_active ? new Date(user.last_active).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Goals & Preferences Card */}
              <Card className="bg-card border shadow-lg" data-oid="5lome9:">
                <CardHeader
                  className="flex flex-row items-center space-y-0 pb-2"
                  data-oid="b4det0u"
                >
                  <Target className="w-5 h-5 text-primary mr-2" data-oid="2ho2-xx" />
                  <CardTitle className="text-lg text-foreground" data-oid="tk4vbim">
                    Goals & Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4" data-oid="_kk:as7">
                  <div data-oid="edypbjq">
                    <Label className="text-sm font-medium text-muted-foreground" data-oid="zi6i7_u">
                      Target Band Score
                    </Label>
                    <p className="text-foreground" data-oid=":2kpq03">
                      {user.target_band_score || 'Not set'}
                    </p>
                  </div>
                  <div data-oid="uxrrozi">
                    <Label className="text-sm font-medium text-muted-foreground" data-oid=":7dv09l">
                      Current Level
                    </Label>
                    <p className="text-foreground" data-oid="taw8x6a">
                      {user.current_level || 'Not set'}
                    </p>
                  </div>
                  <div data-oid="3erdxyh">
                    <Label className="text-sm font-medium text-muted-foreground" data-oid=":iug8sb">
                      Study Hours Goal
                    </Label>
                    <p className="text-foreground" data-oid="pk___i7">
                      {user.study_hours_goal || 0} hours/week
                    </p>
                  </div>
                  <div data-oid=":0-z-sh">
                    <Label className="text-sm font-medium text-muted-foreground" data-oid="p8ih9md">
                      Test Date
                    </Label>
                    <p className="text-foreground" data-oid="xrhe4w6">
                      {user.test_date ? new Date(user.test_date).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                  <div data-oid="-imsdt:">
                    <Label className="text-sm font-medium text-muted-foreground" data-oid="exxp.dr">
                      Weaknesses
                    </Label>
                    <div className="flex flex-wrap gap-1 mt-1" data-oid="xw9odyr">
                      {user.weaknesses && user.weaknesses.length > 0 ? (
                        user.weaknesses.map((weakness) => (
                          <Badge
                            key={weakness}
                            variant="destructive"
                            className="text-xs"
                            data-oid="vjj.929"
                          >
                            {weakness}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm" data-oid="jomaf_-">
                          None specified
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Summary Card */}
              <Card className="bg-card border shadow-lg" data-oid="0en4.hh">
                <CardHeader
                  className="flex flex-row items-center space-y-0 pb-2"
                  data-oid="227772n"
                >
                  <TrendingUp className="w-5 h-5 text-primary mr-2" data-oid="0s0-sge" />
                  <CardTitle className="text-lg text-foreground" data-oid="kpmexoq">
                    Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4" data-oid="3i1_43n">
                  <div data-oid="bc2goav">
                    <Label className="text-sm font-medium text-muted-foreground" data-oid="4nqo4gh">
                      Overall Average
                    </Label>
                    <p className="text-2xl font-bold text-foreground" data-oid="34dn19k">
                      {performanceData.overallAverage}/9.0
                    </p>
                  </div>
                  <div data-oid="v43wzv7">
                    <Label className="text-sm font-medium text-muted-foreground" data-oid="97fnayo">
                      Tests Completed
                    </Label>
                    <p className="text-foreground" data-oid="c0xg873">
                      {performanceData.totalCompleted}
                    </p>
                  </div>
                  <div className="space-y-2" data-oid="d:k0812">
                    <Label className="text-sm font-medium text-muted-foreground" data-oid="2y76shm">
                      Module Breakdown
                    </Label>
                    {Object.entries(performanceData.moduleBreakdown || {}).length > 0 ? (
                      Object.entries(performanceData.moduleBreakdown).map(([module, data]) => {
                        const ModuleIcon = getModuleIcon(module);
                        return (
                          <div
                            key={module}
                            className="flex items-center justify-between p-2 bg-muted rounded"
                            data-oid="ixvw9j."
                          >
                            <div className="flex items-center gap-2" data-oid="h8i.08_">
                              <ModuleIcon className="w-4 h-4 text-primary" data-oid="qv:efja" />
                              <span
                                className="text-sm text-foreground capitalize"
                                data-oid="vc7jtp7"
                              >
                                {module}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs" data-oid="p:e_o9a">
                              {data.average.toFixed(1)}/9.0
                            </Badge>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground text-sm" data-oid="yfwllx8">
                        No tests completed yet.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </m.div>

            {/* Performance Trend Chart */}
            {performanceData.recentTrend && performanceData.recentTrend.length > 0 && (
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                data-oid=".crhmsp"
              >
                <Card className="bg-card border shadow-lg" data-oid="7q9spq3">
                  <CardHeader data-oid="vbneah6">
                    <CardTitle className="text-foreground" data-oid="86dsaf2">
                      Recent Performance Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent data-oid="cnwdxdy">
                    <div className="h-64" data-oid="okbmmog">
                      <ResponsiveContainer width="100%" height="100%" data-oid="t88orfv">
                        <AreaChart data={performanceData.recentTrend} data-oid="r:-sp5m">
                          <defs data-oid="r9:1id7">
                            <linearGradient
                              id="scoreGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                              data-oid="ewv8ajb"
                            >
                              <stop
                                offset="5%"
                                stopColor="#3B82F6"
                                stopOpacity={0.3}
                                data-oid="y1pgdfe"
                              />

                              <stop
                                offset="95%"
                                stopColor="#3B82F6"
                                stopOpacity={0.05}
                                data-oid="8878ejo"
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(var(--border))"
                            data-oid="adtyehi"
                          />

                          <XAxis
                            dataKey="session"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            data-oid="lxn2bns"
                          />

                          <YAxis
                            domain={[0, 9]}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            data-oid="lynojak"
                          />

                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                            data-oid="w9e81hn"
                          />

                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            fill="url(#scoreGradient)"
                            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                            data-oid=":g9hf35"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </m.div>
            )}

            {/* Test History Table */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              data-oid="c4kf6pg"
            >
              <Card className="bg-card border shadow-lg" data-oid="fwoda0p">
                <CardHeader data-oid="qnr1k9a">
                  <CardTitle className="text-foreground" data-oid="l9-3t7u">
                    Test History
                  </CardTitle>
                </CardHeader>
                <CardContent data-oid="2kgdepx">
                  <Table data-oid="2gc67m6">
                    <TableHeader data-oid=".vbtcem">
                      <TableRow
                        className="border-b border-border hover:bg-transparent"
                        data-oid="0twt_f_"
                      >
                        <TableHead className="text-foreground" data-oid="m.xp0.8">
                          Test Type
                        </TableHead>
                        <TableHead className="text-foreground" data-oid=".kd66ok">
                          Score
                        </TableHead>
                        <TableHead className="text-foreground" data-oid="a-z_.s3">
                          Completed
                        </TableHead>
                        <TableHead className="text-foreground" data-oid="p_w3xj3">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody data-oid="y3jcr6_">
                      {testSessions.length > 0 ? (
                        testSessions.map((session) => (
                          <TableRow
                            key={session.id}
                            className="border-b-0 hover:bg-muted/50"
                            data-oid="hw66p-2"
                          >
                            <TableCell
                              className="font-medium text-foreground capitalize"
                              data-oid="b697op9"
                            >
                              {session.test_type}
                            </TableCell>
                            <TableCell className="text-foreground" data-oid="feafir1">
                              {session.score ? `${session.score}/9.0` : 'N/A'}
                            </TableCell>
                            <TableCell className="text-muted-foreground" data-oid="vmaqpn6">
                              {session.completed_at
                                ? new Date(session.completed_at).toLocaleDateString()
                                : 'In Progress'}
                            </TableCell>
                            <TableCell data-oid="wtajj6q">
                              <Badge
                                variant={session.is_completed ? 'default' : 'secondary'}
                                data-oid="t_uy1xj"
                              >
                                {session.is_completed ? 'Completed' : 'In Progress'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow data-oid="k.fb_ds">
                          <TableCell
                            colSpan="4"
                            className="text-center py-8 text-muted-foreground"
                            data-oid="ahvao56"
                          >
                            No tests completed yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </m.div>
          </div>
        </div>
      </div>
    </div>
  );
}
