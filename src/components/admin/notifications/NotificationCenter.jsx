import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
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
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Send,
  Trash2,
  Loader2,
  Info,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Megaphone,
  Sparkles,
  RefreshCcw,
} from 'lucide-react';
import { Notification } from '@/entities';
import { toast } from 'sonner';
import RefinedDeleteModal from '../shared/RefinedDeleteModal';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info',
    target_audience: 'all',
    expires_in_days: 7,
  });

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await Notification.listAll();
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleSend = async () => {
    if (!newNotification.title || !newNotification.message) {
      toast.error('Please fill in title and message');
      return;
    }

    try {
      setSending(true);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(newNotification.expires_in_days));

      await Notification.create({
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        target_audience: newNotification.target_audience,
        expires_at: expiresAt.toISOString(),
      });

      toast.success('Notification broadcasted successfully!');
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        target_audience: 'all',
        expires_in_days: 7,
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Broadcast failed');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await Notification.delete(deletingId);
      toast.success('Notification removed');
      fetchNotifications();
      setDeletingId(null);
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'announcement':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      default:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-10"
      data-oid="264wdil"
    >
      <RefinedDeleteModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Recall Notification"
        description="This will instantly remove the message from all target user dashboards."
        confirmText="CONFIRM RECALL"
        data-oid="aiw4r00"
      />

      {/* Header Section */}
      <div
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
        data-oid="uw_7qqa"
      >
        <motion.div variants={itemVariants} className="space-y-1" data-oid="2gx73tu">
          <h2
            className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3"
            data-oid="bb48cxc"
          >
            <div
              className="p-2 bg-primary/10 rounded-lg text-primary shadow-sm border border-primary/20"
              data-oid="b7fone2"
            >
              <Bell className="w-6 h-6" data-oid="9h5:pqk" />
            </div>
            Notification Hub
          </h2>
          <p className="text-muted-foreground text-lg ml-1" data-oid="nri9tsw">
            Broadcast real-time communications to your community
          </p>
        </motion.div>

        <motion.div variants={itemVariants} data-oid="_p439bb">
          <Button
            variant="outline"
            onClick={fetchNotifications}
            className="rounded-xl border-border/50 bg-card/50 h-11 px-4 hover:bg-muted/50 transition-all font-bold"
            data-oid="ql8nl.k"
          >
            <RefreshCcw
              className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
              data-oid="3pqe:wu"
            />
            RELOAD HISTORY
          </Button>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8" data-oid="vs4:v7u">
        {/* Compose Form */}
        <motion.div variants={itemVariants} className="lg:col-span-4" data-oid="fel2r.n">
          <div
            className="rounded-xl border text-card-foreground bg-card/50 backdrop-blur-sm border-border/50 shadow-sm overflow-hidden"
            data-oid="psgkr4c"
          >
            <div className="p-6 space-y-6" data-oid="fh-axg7">
              <div className="space-y-1" data-oid="zzws1jg">
                <h3
                  className="text-xl font-bold tracking-tight flex items-center gap-2"
                  data-oid="wa5ux1g"
                >
                  <Megaphone className="w-5 h-5 text-primary" data-oid="e1y4ood" />
                  New Notification
                </h3>
                <p
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  data-oid="dd889ul"
                >
                  Create Broadcast Message
                </p>
              </div>

              <div className="space-y-5" data-oid=".g1j-mg">
                <div className="space-y-2" data-oid="w:xfi.c">
                  <Label
                    className="text-xs font-medium uppercase tracking-wider opacity-70 ml-1"
                    data-oid="l_ig0au"
                  >
                    Title
                  </Label>
                  <div className="relative" data-oid="due0m2w">
                    <Sparkles
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                      data-oid="sp7fueh"
                    />

                    <Input
                      value={newNotification.title}
                      onChange={(e) =>
                        setNewNotification({ ...newNotification, title: e.target.value })
                      }
                      placeholder="Enter notification title..."
                      className="h-10 pl-10 bg-background border-border focus-visible:ring-primary/20 rounded-lg"
                      data-oid="ztd8jgv"
                    />
                  </div>
                </div>

                <div className="space-y-2" data-oid="49s3hol">
                  <Label
                    className="text-xs font-medium uppercase tracking-wider opacity-70 ml-1"
                    data-oid="h4gd_.x"
                  >
                    Message
                  </Label>
                  <Textarea
                    value={newNotification.message}
                    onChange={(e) =>
                      setNewNotification({ ...newNotification, message: e.target.value })
                    }
                    placeholder="Enter your notification message..."
                    rows={4}
                    className="bg-background border-border focus-visible:ring-primary/20 rounded-lg resize-none p-3"
                    data-oid="rzxp6al"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4" data-oid="yi7q2yg">
                  <div className="space-y-2" data-oid="etdm2jo">
                    <Label
                      className="text-xs font-medium uppercase tracking-wider opacity-70 ml-1"
                      data-oid="afxt7gr"
                    >
                      Type
                    </Label>
                    <Select
                      value={newNotification.type}
                      onValueChange={(val) => setNewNotification({ ...newNotification, type: val })}
                      data-oid="yodqsxb"
                    >
                      <SelectTrigger
                        className="h-10 bg-background border-border rounded-lg"
                        data-oid="qdz.pey"
                      >
                        <SelectValue data-oid="cu0:egv" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-border" data-oid="h1eqx2p">
                        <SelectItem value="info" data-oid="c8jx0xc">
                          Information
                        </SelectItem>
                        <SelectItem value="success" data-oid="ahb0_j0">
                          Success
                        </SelectItem>
                        <SelectItem value="warning" data-oid="deok4im">
                          System Alert
                        </SelectItem>
                        <SelectItem value="announcement" data-oid="xq2jvte">
                          Announcement
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2" data-oid="1q.tvlq">
                    <Label
                      className="text-xs font-medium uppercase tracking-wider opacity-70 ml-1"
                      data-oid="l4rrg6m"
                    >
                      Audience
                    </Label>
                    <Select
                      value={newNotification.target_audience}
                      onValueChange={(val) =>
                        setNewNotification({ ...newNotification, target_audience: val })
                      }
                      data-oid="rots022"
                    >
                      <SelectTrigger
                        className="h-10 bg-background border-border rounded-lg"
                        data-oid="h5v.qcd"
                      >
                        <SelectValue data-oid=".:zk69m" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-border" data-oid="2dxgwtr">
                        <SelectItem value="all" data-oid="pe9w_n2">
                          All Users
                        </SelectItem>
                        <SelectItem value="free" data-oid=":oqg00n">
                          Free Tier
                        </SelectItem>
                        <SelectItem value="pro" data-oid="rn--_.s">
                          Pro Users
                        </SelectItem>
                        <SelectItem value="premium" data-oid="c3oftej">
                          Premium Users
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2" data-oid="acwpffe">
                  <Label
                    className="text-xs font-medium uppercase tracking-wider opacity-70 ml-1"
                    data-oid=":a7wu63"
                  >
                    Expires In (Days)
                  </Label>
                  <div className="relative" data-oid="35st8ra">
                    <Calendar
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                      data-oid="jdq_66t"
                    />

                    <Input
                      type="number"
                      min="1"
                      value={newNotification.expires_in_days}
                      onChange={(e) =>
                        setNewNotification({ ...newNotification, expires_in_days: e.target.value })
                      }
                      className="h-10 pl-10 bg-background border-border focus-visible:ring-primary/20 rounded-lg"
                      data-oid="w1da0cb"
                    />
                  </div>
                </div>

                <Button
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium"
                  onClick={handleSend}
                  disabled={sending}
                  data-oid="nu2ibv6"
                >
                  {sending ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" data-oid="n5ggbdh" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" data-oid="qoxebx5" />
                  )}
                  Send Notification
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* History List */}
        <motion.div variants={itemVariants} className="lg:col-span-8" data-oid=".3mslx.">
          <div
            className="rounded-xl border text-card-foreground bg-card/50 backdrop-blur-sm border-border/50 shadow-sm overflow-hidden"
            data-oid="9udz.wj"
          >
            <div className="p-0" data-oid="t_29d-f">
              <div className="overflow-x-auto no-scrollbar" data-oid="rud0-.v">
                <Table className="min-w-[800px]" data-oid="geia3.8">
                  <TableHeader
                    className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-200/60 dark:border-blue-800/50"
                    data-oid="1:nvmx8"
                  >
                    <TableRow
                      className="border-b border-white/5 hover:bg-transparent"
                      data-oid="74h7cts"
                    >
                      <TableHead
                        className="w-[300px] px-6 text-xs font-bold uppercase text-blue-700 dark:text-blue-300 tracking-wider"
                        data-oid="z63:lt4"
                      >
                        Notification
                      </TableHead>
                      <TableHead
                        className="px-6 text-xs font-bold uppercase text-blue-700 dark:text-blue-300 tracking-wider"
                        data-oid="9juz5m0"
                      >
                        Type
                      </TableHead>
                      <TableHead
                        className="px-6 text-xs font-bold uppercase text-blue-700 dark:text-blue-300 tracking-wider"
                        data-oid="4t7bzsf"
                      >
                        Audience
                      </TableHead>
                      <TableHead
                        className="px-6 text-xs font-bold uppercase text-blue-700 dark:text-blue-300 tracking-wider"
                        data-oid="bi.59q_"
                      >
                        Expires
                      </TableHead>
                      <TableHead
                        className="px-6 text-xs font-bold uppercase text-blue-700 dark:text-blue-300 tracking-wider text-right"
                        data-oid="po-w136"
                      >
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody data-oid="ubg9wnv">
                    <AnimatePresence mode="popLayout" data-oid="kzp_btq">
                      {loading ? (
                        [...Array(6)].map((_, i) => (
                          <TableRow
                            key={`skeleton-${i}`}
                            className="border-b border-blue-100/60 dark:border-blue-800/40"
                            data-oid="7xhb6fs"
                          >
                            <TableCell colSpan={5} className="py-4 px-6" data-oid="-tpf7dt">
                              <div
                                className="w-full h-6 bg-blue-50/40 dark:bg-blue-900/20 animate-pulse rounded-lg"
                                data-oid="3gpm6:k"
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : notifications.length === 0 ? (
                        <TableRow data-oid="b35kend">
                          <TableCell colSpan={5} className="h-48 text-center" data-oid="4dgib-m">
                            <div
                              className="flex flex-col items-center justify-center space-y-3"
                              data-oid="ezirii5"
                            >
                              <div
                                className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-full border border-blue-200/30 dark:border-blue-800/30"
                                data-oid="6b73zw6"
                              >
                                <Bell
                                  className="w-8 h-8 text-blue-400 opacity-50"
                                  data-oid="pmd5r5n"
                                />
                              </div>
                              <div className="space-y-1" data-oid=".xy6316">
                                <p className="font-bold text-foreground text-lg" data-oid="h:1.c99">
                                  No notifications found
                                </p>
                                <p className="text-sm text-muted-foreground" data-oid="da8_s7y">
                                  Create your first broadcast to get started.
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        notifications.map((notif) => (
                          <motion.tr
                            layout
                            key={notif.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`group transition-all hover:bg-blue-50/40 dark:hover:bg-blue-900/25 border-b border-blue-100/60 dark:border-blue-800/40 bg-white dark:bg-slate-950`}
                            data-oid="1yms9o:"
                          >
                            <TableCell className="px-6 py-3" data-oid="brct:og">
                              <div className="flex items-center gap-3" data-oid="j_oi9rt">
                                <div
                                  className={`p-2 rounded-lg border transition-all duration-200 shadow-sm ${
                                    notif.type === 'success'
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                      : notif.type === 'warning'
                                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                                        : notif.type === 'announcement'
                                          ? 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400'
                                          : 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                                  }`}
                                  data-oid="9cdhz_u"
                                >
                                  {notif.type === 'success' && (
                                    <CheckCircle2 className="w-4 h-4" data-oid="mva-yfj" />
                                  )}
                                  {notif.type === 'warning' && (
                                    <AlertCircle className="w-4 h-4" data-oid="jgd6oww" />
                                  )}
                                  {notif.type === 'announcement' && (
                                    <Megaphone className="w-4 h-4" data-oid="fapxejo" />
                                  )}
                                  {notif.type === 'info' && (
                                    <Info className="w-4 h-4" data-oid="ns4f:e2" />
                                  )}
                                </div>
                                <div className="flex flex-col" data-oid="8ina_31">
                                  <span
                                    className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1"
                                    data-oid="ymqmhk7"
                                  >
                                    {notif.title}
                                  </span>
                                  <span
                                    className="text-[11px] text-muted-foreground font-medium"
                                    data-oid="0wixgu2"
                                  >
                                    ID: {notif.id.substring(0, 8)}...
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-3" data-oid="m15_zhm">
                              <Badge
                                variant="outline"
                                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border shadow-sm ${getBadgeStyle(notif.type)}`}
                                data-oid="2wt1q5_"
                              >
                                {notif.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-6 py-3" data-oid="cdh2ymy">
                              <div
                                className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
                                data-oid="w8ibqsz"
                              >
                                <Users className="w-3.5 h-3.5 opacity-50" data-oid=".ygklls" />
                                <span
                                  className="text-foreground font-semibold capitalize"
                                  data-oid="_f7x-aw"
                                >
                                  {notif.target_audience}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-3" data-oid="yccs4dc">
                              <div className="flex flex-col" data-oid="bvmjlqy">
                                <div
                                  className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
                                  data-oid="v0zxx3u"
                                >
                                  <Calendar
                                    className="w-3.5 h-3.5 text-muted-foreground opacity-40"
                                    data-oid="-g7z.n."
                                  />

                                  {new Date(notif.expires_at).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </div>
                                {new Date(notif.expires_at) < new Date() && (
                                  <span
                                    className="text-[9px] text-red-500 font-bold mt-0.5 uppercase tracking-tighter"
                                    data-oid="cmp0gm2"
                                  >
                                    EXPIRED
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-3 text-right" data-oid="7j5s8pd">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingId(notif.id)}
                                className="h-8 w-8 text-slate-600 hover:bg-red-500/10 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                title="Delete"
                                data-oid="32fi4x1"
                              >
                                <Trash2 className="w-4 h-4" data-oid="r:6hr6t" />
                              </Button>
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default NotificationCenter;
