import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/cn';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Plus,
  Trash2,
  Crown,
  Percent,
  Tag,
  Calendar,
  Users,
  Activity,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Power,
  Clock,
  Edit3,
  ExternalLink,
  Ticket,
  ArrowRight,
  Timer,
} from 'lucide-react';
import { PromoCode } from '@/entities';
import { toast } from 'sonner';

const PromoManagement = () => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingPromo, setIsAddingPromo] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 0,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    max_uses: 100,
    applicable_plans: ['pro'],
    grants_subscription: null, // 'pro', 'premium', or null
    subscription_duration_days: 30,
  });

  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      const promoData = await PromoCode.list();
      setPromoCodes(promoData || []);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast.error('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const handleAddPromo = async () => {
    try {
      if (!newPromo.code.trim()) {
        toast.error('Promo code is required.');
        return;
      }

      if (!newPromo.valid_until) {
        toast.error('Code expiration date is required.');
        return;
      }

      if (!newPromo.grants_subscription && newPromo.discount_value <= 0) {
        toast.error('Discount value must be greater than 0.');
        return;
      }

      if (
        newPromo.grants_subscription &&
        (!newPromo.subscription_duration_days || newPromo.subscription_duration_days < 1)
      ) {
        toast.error('Duration is required for subscription grants.');
        return;
      }

      const existingCode = promoCodes.find(
        (promo) => promo.code.toLowerCase() === newPromo.code.toLowerCase().trim()
      );

      if (existingCode) {
        toast.error(`Promo code "${newPromo.code}" already exists.`);
        return;
      }

      await PromoCode.create({
        ...newPromo,
        code: newPromo.code.trim().toUpperCase(),
        is_active: true,
        current_uses: 0,
      });

      setIsAddingPromo(false);
      setNewPromo({
        code: '',
        discount_type: 'percentage',
        discount_value: 0,
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: '',
        max_uses: 100,
        applicable_plans: ['pro'],
        grants_subscription: null,
        subscription_duration_days: 30,
      });

      fetchPromoCodes();
      toast.success('Promo code created successfully!');
    } catch (error) {
      console.error('Error adding promo code:', error);
      toast.error(error.message || 'Failed to create promo code');
    }
  };

  const togglePromoStatus = async (promoId, currentStatus) => {
    try {
      await PromoCode.update(promoId, { is_active: !currentStatus });
      fetchPromoCodes();
      toast.success(`Promo code ${currentStatus ? 'deactivated' : 'activated'} successfully`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDeletePromo = async (promo) => {
    try {
      await PromoCode.delete(promo.id);
      fetchPromoCodes();
      toast.success('Promo code deleted');
    } catch (error) {
      console.warn('Hard delete failed, attempting soft delete', error);
      try {
        await PromoCode.update(promo.id, { is_active: false });
        fetchPromoCodes();
        toast.success('Promo code deactivated');
      } catch {
        toast.error('Failed to remove promo code');
      }
    }
  };

  const stats = {
    total: promoCodes.length,
    active: promoCodes.filter((p) => p.is_active).length,
    totalUses: promoCodes.reduce((acc, p) => acc + (p.current_uses || 0), 0),
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-10 pt-12 md:pt-0"
      data-oid="xefa5fm"
    >
      {/* Header Section */}
      <div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-1"
        data-oid="t09iq41"
      >
        <motion.div variants={itemVariants} className="space-y-0.5 min-w-0" data-oid="hmt29g7">
          <h2
            className="text-lg sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2.5"
            data-oid="p_m5rx-"
          >
            <div
              className="p-2 sm:p-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 shadow-2xs shrink-0"
              data-oid="3a1l_ft"
            >
              <Crown className="w-4 h-4 sm:w-5 sm:h-5" data-oid="gttwt3-" />
            </div>
            <span className="truncate">Promo Management</span>
          </h2>
          <p
            className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400"
            data-oid=".4etj32"
          >
            Create, manage, and monitor promotional discount codes and subscription access keys
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="w-full sm:w-auto shrink-0 mt-1 sm:mt-0"
          data-oid="0d8o7jk"
        >
          <Dialog open={isAddingPromo} onOpenChange={setIsAddingPromo} data-oid="1h:ezv_">
            <DialogTrigger asChild data-oid="tg9ov7q">
              <Button
                className="w-full sm:w-auto justify-center h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all duration-200 flex items-center gap-2"
                data-oid="inebb0n"
              >
                <Plus className="w-4 h-4" data-oid="sqgy9wi" />
                <span>Add Promo Code</span>
              </Button>
            </DialogTrigger>
            <DialogContent
              className="w-[95vw] sm:w-full sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
              data-oid="6etczsj"
            >
              <DialogHeader className="space-y-1" data-oid="gki-6n1">
                <DialogTitle
                  className="text-xl font-black tracking-tight text-slate-950 dark:text-white"
                  data-oid="5b3idyz"
                >
                  Create Promo Code
                </DialogTitle>
                <DialogDescription
                  className="text-xs font-medium text-slate-500 dark:text-slate-400"
                  data-oid="1brzt1:"
                >
                  Generate discount rules or direct tier access codes for users
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4" data-oid="iep-4g7">
                <div className="space-y-2" data-oid="ebahrfj">
                  <Label
                    className="text-sm font-black ml-1 text-muted-foreground uppercase tracking-widest opacity-70"
                    data-oid="3vahjbo"
                  >
                    Promo Code
                  </Label>
                  <div className="relative group" data-oid="2:x92_v">
                    <div
                      className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                      data-oid=":ttqf:y"
                    >
                      <Ticket
                        className="w-5 h-5 text-primary/40 group-focus-within:text-primary transition-colors"
                        data-oid="mkff46j"
                      />
                    </div>
                    <Input
                      value={newPromo.code}
                      onChange={(e) =>
                        setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })
                      }
                      placeholder="ENTER PROMO CODE"
                      className="h-14 pl-12 bg-muted/20 border-border/50 text-foreground font-mono text-xl font-black uppercase tracking-widest placeholder:opacity-20 rounded-[1.25rem] focus-visible:ring-primary/20 transition-all border-dashed hover:border-primary/50"
                      data-oid="csm.2nx"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4" data-oid="sj7c523">
                  <div className="space-y-2" data-oid="6s5ad_h">
                    <Label
                      className="text-sm font-black ml-1 text-muted-foreground uppercase tracking-widest opacity-70"
                      data-oid="_yyo6c1"
                    >
                      Scheme
                    </Label>
                    <Select
                      value={newPromo.grants_subscription ? 'grant' : newPromo.discount_type}
                      onValueChange={(value) => {
                        if (value === 'grant') {
                          setNewPromo({
                            ...newPromo,
                            grants_subscription: 'pro',
                            discount_value: 0,
                          });
                        } else {
                          setNewPromo({
                            ...newPromo,
                            discount_type: value,
                            grants_subscription: null,
                            discount_value: value === 'percentage' ? 20 : 10,
                          });
                        }
                      }}
                      data-oid="1s1u1.d"
                    >
                      <SelectTrigger
                        className="h-12 bg-muted/20 border-border/50 rounded-2xl font-bold"
                        data-oid="k8kn8z."
                      >
                        <SelectValue data-oid="h7nm1k6" />
                      </SelectTrigger>
                      <SelectContent
                        className="bg-popover/95 backdrop-blur-xl rounded-2xl border-border/50"
                        data-oid="miyyu7u"
                      >
                        <SelectItem value="percentage" data-oid="nqk0wzu">
                          Percentage Off
                        </SelectItem>
                        <SelectItem value="fixed" data-oid="k1w7ohp">
                          Fixed Price
                        </SelectItem>
                        <SelectItem value="grant" data-oid="rx:k:60">
                          👑 Grant Access
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newPromo.grants_subscription ? (
                    <div className="space-y-2" data-oid="yv:h.-q">
                      <Label
                        className="text-sm font-black ml-1 text-purple-500 uppercase tracking-widest opacity-70"
                        data-oid="7y0bbnv"
                      >
                        Target Tier
                      </Label>
                      <Select
                        value={newPromo.grants_subscription}
                        onValueChange={(value) =>
                          setNewPromo({ ...newPromo, grants_subscription: value })
                        }
                        data-oid="06jm3dk"
                      >
                        <SelectTrigger
                          className="h-12 bg-purple-500/5 border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-2xl font-black transition-all hover:border-purple-500/50"
                          data-oid="gwz8x7s"
                        >
                          <SelectValue data-oid="0h4fgdd" />
                        </SelectTrigger>
                        <SelectContent
                          className="bg-popover/95 backdrop-blur-xl rounded-2xl border-border/50"
                          data-oid="v2j4fk3"
                        >
                          <SelectItem value="pro" data-oid="gkhenxg">
                            🔵 PRO Tier
                          </SelectItem>
                          <SelectItem value="premium" data-oid="h.z.51d">
                            💎 PREMIUM Tier
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2" data-oid="xr::zdu">
                      <Label
                        className="text-sm font-black ml-1 text-muted-foreground uppercase tracking-widest opacity-70"
                        data-oid="kyzjrxj"
                      >
                        Value
                      </Label>
                      <div className="relative group" data-oid="x1zc6h_">
                        <div
                          className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                          data-oid="71-z3r3"
                        >
                          {newPromo.discount_type === 'percentage' ? (
                            <Percent
                              className="w-4 h-4 text-primary/60 group-focus-within:text-primary transition-colors"
                              data-oid="2kpm3wn"
                            />
                          ) : (
                            <span
                              className="text-primary/60 font-black text-sm group-focus-within:text-primary transition-colors ml-1"
                              data-oid="ox_g171"
                            >
                              $
                            </span>
                          )}
                        </div>
                        <Input
                          type="number"
                          value={newPromo.discount_value}
                          onChange={(e) =>
                            setNewPromo({ ...newPromo, discount_value: parseInt(e.target.value) })
                          }
                          placeholder="20"
                          className="h-12 pl-10 bg-muted/20 border-border/50 text-foreground font-black rounded-2xl focus-visible:ring-primary/20 transition-all hover:border-primary/50"
                          data-oid="3fp9k_w"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4" data-oid="ce8vad3">
                  <div className="space-y-2" data-oid="qjlitzs">
                    <Label
                      className="text-sm font-black ml-1 text-muted-foreground uppercase tracking-widest opacity-70 text-[10px]"
                      data-oid="bom4xg8"
                    >
                      Code Life (Expiry)
                    </Label>
                    <div className="relative group" data-oid="ge51iw3">
                      <Popover data-oid="pop-expiry">
                        <PopoverTrigger asChild data-oid="trigger-expiry">
                          <Button
                            variant="outline"
                            className={cn(
                              'h-12 w-full pl-12 justify-start text-left font-bold bg-muted/20 border-border/50 rounded-2xl focus-visible:ring-primary/20 transition-all hover:border-primary/50',
                              !newPromo.valid_until && 'text-muted-foreground'
                            )}
                            data-oid="btn-expiry"
                          >
                            <Calendar
                              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within:text-primary transition-colors"
                              data-oid="cigyeth"
                            />
                            {newPromo.valid_until ? (
                              format(new Date(newPromo.valid_until), 'PPP')
                            ) : (
                              <span className="opacity-40">Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 bg-popover/95 backdrop-blur-xl border-border/50 rounded-3xl overflow-hidden shadow-2xl"
                          align="start"
                          data-oid="content-expiry"
                        >
                          <CalendarUI
                            mode="single"
                            selected={
                              newPromo.valid_until ? new Date(newPromo.valid_until) : undefined
                            }
                            onSelect={(date) =>
                              setNewPromo({
                                ...newPromo,
                                valid_until: date ? date.toISOString().split('T')[0] : '',
                              })
                            }
                            initialFocus
                            disabled={(date) => date < new Date() || date < new Date('1900-01-01')}
                            data-oid="cal-expiry"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  {newPromo.grants_subscription ? (
                    <div className="space-y-2" data-oid="i_z5mhd">
                      <Label
                        className="text-sm font-black ml-1 text-purple-500 uppercase tracking-widest opacity-70 text-[10px]"
                        data-oid="0xrwg50"
                      >
                        Access Duration
                      </Label>
                      <div className="relative group" data-oid="i0eh.m5">
                        <Timer
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500/40 group-focus-within:text-purple-500 transition-colors"
                          data-oid="8:ut4:r"
                        />

                        <Input
                          type="number"
                          value={newPromo.subscription_duration_days}
                          onChange={(e) =>
                            setNewPromo({
                              ...newPromo,
                              subscription_duration_days: parseInt(e.target.value) || 30,
                            })
                          }
                          placeholder="30"
                          className="h-12 pl-12 bg-purple-500/5 border-purple-500/20 text-foreground font-black rounded-2xl focus-visible:ring-purple-500/30 transition-all hover:border-purple-500/50"
                          data-oid="x0xx.f2"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2" data-oid="trt0vvh">
                      <Label
                        className="text-sm font-black ml-1 text-muted-foreground uppercase tracking-widest opacity-70 text-[10px]"
                        data-oid="77323a."
                      >
                        Usage Cap
                      </Label>
                      <div className="relative group" data-oid="omkbjns">
                        <Users
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within:text-primary transition-colors"
                          data-oid="4tzdy2h"
                        />

                        <Input
                          type="number"
                          value={newPromo.max_uses}
                          onChange={(e) =>
                            setNewPromo({ ...newPromo, max_uses: parseInt(e.target.value) })
                          }
                          placeholder="100"
                          className="h-12 pl-12 bg-muted/20 border-border/50 text-foreground font-black rounded-2xl focus-visible:ring-primary/20 transition-all hover:border-primary/50"
                          data-oid="1f5qxtx"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {newPromo.grants_subscription && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-2"
                    data-oid="4a7f9p."
                  >
                    <Label
                      className="text-sm font-black ml-1 text-muted-foreground uppercase tracking-widest opacity-70 text-[10px]"
                      data-oid="8ltnsg1"
                    >
                      Total Redemptions
                    </Label>
                    <div className="relative group" data-oid="28.n3h0">
                      <Users
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within:text-primary transition-colors"
                        data-oid="ut674z6"
                      />

                      <Input
                        type="number"
                        value={newPromo.max_uses}
                        onChange={(e) =>
                          setNewPromo({ ...newPromo, max_uses: parseInt(e.target.value) })
                        }
                        placeholder="100"
                        className="h-12 pl-12 bg-muted/20 border-border/50 text-foreground font-black rounded-2xl focus-visible:ring-primary/20 transition-all hover:border-primary/50"
                        data-oid="0w0lynd"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
              <DialogFooter className="gap-3" data-oid="0un10sj">
                <Button
                  variant="ghost"
                  onClick={() => setIsAddingPromo(false)}
                  className="rounded-xl font-bold h-11"
                  data-oid="es9zxy3"
                >
                  CANCEL
                </Button>
                <Button
                  onClick={handleAddPromo}
                  className="h-11 px-8 rounded-xl font-black bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                  data-oid="lpwejeh"
                >
                  Create Promo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4" data-oid="ht6hdc1">
        {[
          { label: 'Active Promos', value: stats.active, icon: Sparkles, color: 'rose' },
          { label: 'Total Uses', value: stats.totalUses, icon: Activity, color: 'indigo' },
          { label: 'Total Codes', value: stats.total, icon: Tag, color: 'emerald' },
        ].map((item, idx) => (
          <motion.div key={idx} variants={itemVariants} data-oid="fsogbvg">
            <Card
              className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 rounded-2xl shadow-2xs overflow-hidden"
              data-oid="fo7lk0x"
            >
              <CardContent
                className="p-2.5 sm:p-4 flex items-center justify-between gap-1.5 sm:gap-2"
                data-oid="txz9-xr"
              >
                <div className="min-w-0" data-oid="qza69_b">
                  <p
                    className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5 truncate"
                    data-oid="sl4pda0"
                  >
                    {item.label}
                  </p>
                  <h4
                    className="text-base sm:text-2xl font-black text-slate-950 dark:text-white leading-none"
                    data-oid="w7i27i:"
                  >
                    {item.value}
                  </h4>
                </div>
                <div
                  className={`p-1.5 sm:p-2.5 rounded-xl border shrink-0 ${
                    item.color === 'rose'
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40'
                      : item.color === 'indigo'
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/40'
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40'
                  }`}
                  data-oid="go7cflq"
                >
                  <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" data-oid="yj8k6pd" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div variants={itemVariants} data-oid="4qa3z_l">
        {!loading && promoCodes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-24 flex flex-col items-center justify-center text-center bg-card/20 backdrop-blur-sm border border-dashed border-border/50 rounded-[3rem]"
            data-oid="3_.:kae"
          >
            <div
              className="p-6 bg-primary/5 rounded-full border border-primary/20 shadow-inner"
              data-oid="mean9lc"
            >
              <Ticket className="w-12 h-12 text-primary opacity-40" data-oid="q3xjy9z" />
            </div>
            <div className="space-y-2 mt-6" data-oid="7wh:933">
              <h3 className="font-black text-2xl text-foreground tracking-tight" data-oid="8g-z-:8">
                No Promo Codes Yet
              </h3>
              <p
                className="text-muted-foreground max-w-[280px] mx-auto font-medium"
                data-oid="gjzhiuh"
              >
                Create your first campaign to start driving more subscriptions.
              </p>
            </div>
            <Button
              onClick={() => setIsAddingPromo(true)}
              className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 rounded-2xl font-black shadow-lg shadow-primary/20"
              data-oid="7nesa_2"
            >
              Initialize First Campaign
            </Button>
          </motion.div>
        ) : (
          <div
            className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
            data-oid="2_wr1zd"
          >
            <AnimatePresence mode="popLayout" data-oid="s2q7nt2">
              {loading
                ? [...Array(10)].map((_, i) => (
                    <div
                      key={`skeleton-${i}`}
                      className="h-[175px] rounded-2xl bg-muted/20 animate-pulse border border-border/50"
                      data-oid="-lo.y9o"
                    />
                  ))
                : promoCodes.map((promo) => {
                    const isExpired = new Date(promo.valid_until) < new Date();
                    const usagePercentage = Math.min(
                      ((promo.current_uses || 0) / (promo.max_uses || 1)) * 100,
                      100
                    );

                    return (
                      <motion.div
                        layout
                        key={promo.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group relative"
                        data-oid="tb3qs9z"
                      >
                        <Card
                          className={`relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 shadow-2xs transition-all duration-200 hover:border-slate-300 hover:shadow-xs flex flex-col justify-between ${!promo.is_active || isExpired ? 'opacity-65' : ''}`}
                          data-oid="bz44b1w"
                        >
                          <CardContent
                            className="p-3.5 space-y-3 flex-1 flex flex-col justify-between"
                            data-oid="pc_4hrp"
                          >
                            {/* Top Row: Code, Status & Quick Actions */}
                            <div className="space-y-1" data-oid="q2a02es">
                              <div
                                className="flex items-center justify-between gap-1"
                                data-oid="97oe6q_"
                              >
                                <span
                                  className="font-mono text-sm font-black text-slate-950 dark:text-white tracking-tight truncate"
                                  data-oid="lakyau4"
                                >
                                  {promo.code}
                                </span>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => togglePromoStatus(promo.id, promo.is_active)}
                                    className={`h-6 w-6 rounded-md ${promo.is_active ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'}`}
                                    data-oid="-e4n69n"
                                  >
                                    <Power className="w-3 h-3" data-oid="ti3md76" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeletePromo(promo)}
                                    className="h-6 w-6 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md"
                                    data-oid="s:e4kc9"
                                  >
                                    <Trash2 className="w-3 h-3" data-oid="d820kin" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5" data-oid="551a25a">
                                <Badge
                                  variant="outline"
                                  className={`rounded-md px-1.5 py-0.5 text-[8px] uppercase font-black tracking-wider border shrink-0 ${
                                    isExpired
                                      ? 'bg-rose-50 text-rose-600 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900'
                                      : promo.is_active
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900'
                                        : 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900'
                                  }`}
                                  data-oid="y_04_jw"
                                >
                                  {isExpired ? 'Expired' : promo.is_active ? 'Active' : 'Paused'}
                                </Badge>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">
                                  Promo Code
                                </span>
                              </div>
                            </div>

                            {/* Middle Section: Scheme / Grant details */}
                            <div
                              className="p-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-slate-900/40 flex items-center gap-2"
                              data-oid="lvjua9_"
                            >
                              <div
                                className={`p-1.5 rounded-lg border shrink-0 ${promo.grants_subscription ? 'bg-purple-50 text-purple-600 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800' : 'bg-indigo-50 text-indigo-600 border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800'}`}
                                data-oid="c.w7qxf"
                              >
                                {promo.grants_subscription ? (
                                  <Crown className="w-3.5 h-3.5" data-oid="emkorr3" />
                                ) : promo.discount_type === 'percentage' ? (
                                  <Percent className="w-3.5 h-3.5" data-oid="vryv52a" />
                                ) : (
                                  <Tag className="w-3.5 h-3.5" data-oid="a6oiygw" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1 space-y-0.5" data-oid="w6gwrad">
                                <h3
                                  className="font-black text-xs leading-tight text-slate-950 dark:text-white truncate"
                                  data-oid="kf37n66"
                                >
                                  {promo.grants_subscription ? (
                                    <span className="capitalize" data-oid="kkzn9h_">
                                      {promo.grants_subscription} Access
                                    </span>
                                  ) : (
                                    <span data-oid="97pxef4">
                                      {promo.discount_value}
                                      {promo.discount_type === 'percentage' ? '% Off' : '$ Fixed'}
                                    </span>
                                  )}
                                </h3>
                                <p
                                  className="text-[10px] text-slate-500 font-medium truncate"
                                  data-oid="yxqs:g8"
                                >
                                  {promo.grants_subscription
                                    ? `${promo.subscription_duration_days} days tier grant`
                                    : `Checkout discount`}
                                </p>
                              </div>
                            </div>

                            {/* Bottom Section: Expiry & Progress */}
                            <div className="space-y-1.5 pt-0.5" data-oid="4ufas4f">
                              <div
                                className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold text-slate-500"
                                data-oid="h97cakb"
                              >
                                <div
                                  className="flex items-center gap-1 text-slate-400"
                                  data-oid="e798t3h"
                                >
                                  <Calendar className="w-3 h-3" data-oid="olf.xea" />
                                  <span data-oid="6oxki71">
                                    Exp{' '}
                                    {new Date(promo.valid_until).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                </div>
                                <div
                                  className="text-slate-700 dark:text-slate-300 font-mono font-extrabold"
                                  data-oid="..rwin9"
                                >
                                  {promo.current_uses || 0}/{promo.max_uses}
                                </div>
                              </div>

                              <div
                                className="relative h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
                                data-oid="342k:uk"
                              >
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${usagePercentage}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut' }}
                                  className={`h-full rounded-full ${
                                    usagePercentage > 90
                                      ? 'bg-rose-500'
                                      : promo.grants_subscription
                                        ? 'bg-purple-600'
                                        : 'bg-indigo-600'
                                  }`}
                                  data-oid="ct45w:1"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default PromoManagement;
