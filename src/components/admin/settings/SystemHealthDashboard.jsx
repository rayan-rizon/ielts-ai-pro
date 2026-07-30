import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SystemHealth } from '@/features/admin/services/SystemHealth';
import { SystemSetting } from '@/features/admin/services/SystemSetting';
import { Activity, Clock, Gauge, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SystemHealthDashboard = ({ maintenanceMode, onToggleMaintenance, isUpdating }) => {
  const [health, setHealth] = useState({
    status: 'checking', // online, degradated, offline
    latency: 0,
    dbSize: 'Unknown',
    errors24h: 0,
    warnings24h: 0,
    lastCheck: new Date(),
  });
  const [errorLog, setErrorLog] = useState([]);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    const latency = await SystemHealth.checkLatency();
    const stats = await SystemHealth.getStats();
    const aiHealth = await SystemHealth.checkAIServiceHealth();
    const paymentHealth = await SystemHealth.checkPaymentServiceHealth();

    setHealth({
      status: latency !== -1 && latency < 500 ? 'online' : latency === -1 ? 'offline' : 'degraded',
      latency: latency === -1 ? 0 : latency,
      dbSize: stats?.db_size || 'Unknown',
      errors24h: stats?.error_count_24h || 0,
      warnings24h: stats?.warning_count_24h || 0,
      aiStatus: aiHealth.status,
      aiLatency: aiHealth.latency,
      aiCalls24h: stats?.ai_total_calls_24h || 0,
      aiErrors24h: stats?.ai_errors_24h || 0,
      paymentStatus: paymentHealth.status,
      paymentErrors24h: stats?.payment_errors_24h || 0,
      lastCheck: new Date(),
    });

    if (stats?.error_count_24h > 0) {
      SystemHealth.getErrorHistory(5).then(setErrorLog);
    }
  };

  const statusColor = {
    online: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    degraded: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    offline: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  }[health.status];

  console.log('Health State:', health);

  return (
    <div className="space-y-6" data-oid="yqie2t6">
      {/* KPI Cards Row (2 Columns on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4" data-oid="r:iaur6">
        {/* Database Status */}
        <Card
          className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/80 rounded-2xl shadow-2xs hover:border-slate-300 transition-all"
          data-oid="2jgbef:"
        >
          <CardContent className="p-5" data-oid="d33z4a:">
            <div className="flex justify-between items-start mb-3" data-oid="hnyc2c0">
              <div
                className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
                data-oid="-4_ca6r"
              >
                <Activity className="w-4 h-4" data-oid="8n02nhp" />
              </div>
              <Badge
                variant="outline"
                className={`capitalize border font-bold text-[10px] py-0.5 px-2.5 rounded-full ${statusColor}`}
                data-oid="uuqiyf1"
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full mr-1.5 ${health.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-current'}`}
                  data-oid="ka5qtey"
                />
                {health.status}
              </Badge>
            </div>
            <div data-oid="i.h.p_l">
              <p
                className="text-xs font-semibold text-slate-500 dark:text-slate-400"
                data-oid="m:7-pox"
              >
                Database Latency
              </p>
              <h3
                className="text-2xl font-black text-slate-950 dark:text-white tracking-tight mt-0.5"
                data-oid="rbcc-ny"
              >
                {health.latency}ms
              </h3>
            </div>
            <div
              className="mt-3 text-[11px] font-medium text-slate-400 flex items-center gap-1.5 pt-3 border-t border-slate-100 dark:border-white/5"
              data-oid="pg2ayen"
            >
              <Clock className="w-3 h-3 text-slate-400" data-oid="z.2tvm-" />
              <span>Checked: {health.lastCheck.toLocaleTimeString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* AI Service Status */}
        <Card
          className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/80 rounded-2xl shadow-2xs hover:border-slate-300 transition-all"
          data-oid="jdthz:7"
        >
          <CardContent className="p-5" data-oid="ptke9f.">
            <div className="flex justify-between items-start mb-3" data-oid="mqu6nxf">
              <div
                className="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400"
                data-oid="g-e-vb-"
              >
                <ShieldCheck className="w-4 h-4" data-oid="k:uh:e6" />
              </div>
              <Badge
                variant="outline"
                className={`capitalize border font-bold text-[10px] py-0.5 px-2.5 rounded-full ${
                  health.aiStatus === 'online'
                    ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400'
                    : 'text-rose-700 bg-rose-500/10 border-rose-500/20 dark:text-rose-400'
                }`}
              >
                {health.aiStatus}
              </Badge>
            </div>
            <div data-oid="bn-_bai">
              <p
                className="text-xs font-semibold text-slate-500 dark:text-slate-400"
                data-oid="lfor1lp"
              >
                AI Engine (Gemini)
              </p>
              <h3
                className="text-2xl font-black text-slate-950 dark:text-white tracking-tight mt-0.5"
                data-oid="bl-28tb"
              >
                {health.aiLatency > 0 ? `${health.aiLatency}ms` : 'Ready'}
              </h3>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-slate-400 pt-3 border-t border-slate-100 dark:border-white/5">
              <span>{health.aiCalls24h} calls today</span>
              <span className={health.aiErrors24h > 0 ? 'text-rose-500 font-bold' : ''}>
                {health.aiErrors24h} errors
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Gateway Status */}
        <Card
          className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/80 rounded-2xl shadow-2xs hover:border-slate-300 transition-all"
          data-oid="xjpu4wi"
        >
          <CardContent className="p-5" data-oid="-r380ov">
            <div className="flex justify-between items-start mb-3" data-oid="y8z--40">
              <div
                className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
                data-oid="_ik4fod"
              >
                <Gauge className="w-4 h-4" data-oid="pyad4-k" />
              </div>
              <Badge
                variant="outline"
                className={`capitalize border font-bold text-[10px] py-0.5 px-2.5 rounded-full ${
                  health.paymentStatus === 'online'
                    ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400'
                    : 'text-amber-700 bg-amber-500/10 border-amber-500/20 dark:text-amber-400'
                }`}
              >
                {health.paymentStatus}
              </Badge>
            </div>
            <div data-oid="_873vcz">
              <p
                className="text-xs font-semibold text-slate-500 dark:text-slate-400"
                data-oid="mv8onah"
              >
                Payment Gateway (Stripe)
              </p>
              <h3
                className="text-2xl font-black text-slate-950 dark:text-white tracking-tight mt-0.5"
                data-oid="81fmrco"
              >
                {health.paymentStatus === 'online' ? 'Connected' : 'Syncing'}
              </h3>
            </div>
            <div
              className="mt-3 text-[11px] font-medium text-slate-400 pt-3 border-t border-slate-100 dark:border-white/5 truncate"
              data-oid="c8dreom"
            >
              {health.paymentErrors24h > 0 ? (
                <span className="text-rose-500 font-bold">
                  {health.paymentErrors24h} sync errors
                </span>
              ) : (
                'Synchronized'
              )}
            </div>
          </CardContent>
        </Card>

        {/* Storage Usage */}
        <Card
          className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/80 rounded-2xl shadow-2xs hover:border-slate-300 transition-all"
          data-oid="jdthz:7"
        >
          <CardContent className="p-5" data-oid="ptke9f.">
            <div className="flex justify-between items-start mb-3" data-oid="mqu6nxf">
              <div
                className="p-2.5 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                data-oid="g-e-vb-"
              >
                <Gauge className="w-4 h-4" data-oid="k:uh:e6" />
              </div>
              <Badge
                variant="outline"
                className="border font-bold text-[10px] py-0.5 px-2.5 rounded-full text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10"
              >
                Storage
              </Badge>
            </div>
            <div data-oid="bn-_bai">
              <p
                className="text-xs font-semibold text-slate-500 dark:text-slate-400"
                data-oid="lfor1lp"
              >
                Database Size
              </p>
              <h3
                className="text-2xl font-black text-slate-950 dark:text-white tracking-tight mt-0.5"
                data-oid="bl-28tb"
              >
                {health.dbSize}
              </h3>
            </div>
            <p
              className="mt-3 text-[11px] font-medium text-slate-400 pt-3 border-t border-slate-100 dark:border-white/5"
              data-oid="rq1.dm8"
            >
              All tables & indexes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Operational Control & Monitoring Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* System Operations & Maintenance */}
        <Card
          className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/80 rounded-2xl shadow-2xs"
          data-oid="5bp1-hy"
        >
          <CardHeader
            className="pb-3 border-b border-slate-100 dark:border-white/5"
            data-oid="f4:dvat"
          >
            <CardTitle
              className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2"
              data-oid="19skzko"
            >
              <ShieldCheck
                className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                data-oid="jrm3myk"
              />
              <span>System Operations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4" data-oid="u.-ky2u">
            <div
              className="flex items-center justify-between p-4 border border-slate-200/80 dark:border-white/10 rounded-xl bg-slate-50/60 dark:bg-slate-900/40"
              data-oid="vvqorn8"
            >
              <div className="space-y-1 pr-4" data-oid="9ads_.h">
                <Label
                  className="text-sm font-bold text-slate-950 dark:text-white"
                  data-oid="7bkcv9d"
                >
                  Maintenance Mode
                </Label>
                <p
                  className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed"
                  data-oid="g3d26od"
                >
                  Restrict platform access for non-admin users during database updates or system
                  maintenance.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0" data-oid="9eaj5mc">
                {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={onToggleMaintenance}
                  disabled={isUpdating}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Global Error Monitoring */}
        <Card
          className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/80 rounded-2xl shadow-2xs"
          data-oid="xjpu4wi"
        >
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>System Errors (24h)</span>
              </CardTitle>
              {health.errors24h > 0 && (
                <Badge
                  variant="destructive"
                  className="animate-pulse text-[10px] font-bold px-2 py-0.5 rounded-full"
                >
                  {health.errors24h} Active Logs
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight">
                  {health.errors24h}
                </h4>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {health.warnings24h} general warnings recorded in the last 24 hours.
                </p>
              </div>
            </div>

            {health.errors24h > 0 && errorLog.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Recent Alerts
                </h5>
                <div className="space-y-2">
                  {errorLog.slice(0, 3).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/10"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {log.message}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium">
                          <span>{log.component}</span>
                          <span>•</span>
                          <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemHealthDashboard;
