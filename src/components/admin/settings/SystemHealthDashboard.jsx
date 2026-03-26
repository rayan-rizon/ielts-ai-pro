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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-oid="r:iaur6">
        {/* Database Status */}
        <Card
          className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm relative overflow-hidden"
          data-oid="2jgbef:"
        >
          <CardContent className="p-5" data-oid="d33z4a:">
            <div className="flex justify-between items-start mb-2" data-oid="hnyc2c0">
              <div className="p-2 rounded-lg bg-primary/10 text-primary" data-oid="-4_ca6r">
                <Activity className="w-5 h-5" data-oid="8n02nhp" />
              </div>
              <Badge
                variant="outline"
                className={`capitalize border shadow-sm ${statusColor}`}
                data-oid="uuqiyf1"
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full mr-2 ${health.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-current'}`}
                  data-oid="ka5qtey"
                />

                {health.status}
              </Badge>
            </div>
            <div data-oid="i.h.p_l">
              <p className="text-sm font-medium text-muted-foreground" data-oid="m:7-pox">
                Database Latency
              </p>
              <h3 className="text-2xl font-bold tracking-tight" data-oid="rbcc-ny">
                {health.latency}ms
              </h3>
            </div>
            <div
              className="mt-4 text-xs text-muted-foreground flex items-center gap-1"
              data-oid="pg2ayen"
            >
              <Clock className="w-3 h-3" data-oid="z.2tvm-" />
              Updated: {health.lastCheck.toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>

        {/* AI Service Status */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm" data-oid="jdthz:7">
          <CardContent className="p-5" data-oid="ptke9f.">
            <div className="flex justify-between items-start mb-2" data-oid="mqu6nxf">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500" data-oid="g-e-vb-">
                <ShieldCheck className="w-5 h-5" data-oid="k:uh:e6" />
              </div>
              <Badge
                variant="outline"
                className={`capitalize border shadow-sm ${
                  health.aiStatus === 'online'
                    ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                }`}
              >
                {health.aiStatus}
              </Badge>
            </div>
            <div data-oid="bn-_bai">
              <p className="text-sm font-medium text-muted-foreground" data-oid="lfor1lp">
                AI Engine (Gemini)
              </p>
              <h3 className="text-2xl font-bold tracking-tight" data-oid="bl-28tb">
                {health.aiLatency > 0 ? `${health.aiLatency}ms` : 'Ready'}
              </h3>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>{health.aiCalls24h} calls today</span>
              <span className={health.aiErrors24h > 0 ? 'text-rose-500 font-medium' : ''}>
                {health.aiErrors24h} errors
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Gateway Status */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm" data-oid="xjpu4wi">
          <CardContent className="p-5" data-oid="-r380ov">
            <div className="flex justify-between items-start mb-2" data-oid="y8z--40">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500" data-oid="_ik4fod">
                <Gauge className="w-5 h-5" data-oid="pyad4-k" />
              </div>
              <Badge
                variant="outline"
                className={`capitalize border shadow-sm ${
                  health.paymentStatus === 'online'
                    ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                }`}
              >
                {health.paymentStatus}
              </Badge>
            </div>
            <div data-oid="_873vcz">
              <p className="text-sm font-medium text-muted-foreground" data-oid="mv8onah">
                Payment Gateway (Stripe)
              </p>
              <h3 className="text-2xl font-bold tracking-tight" data-oid="81fmrco">
                {health.paymentStatus === 'online' ? 'Connected' : 'Syncing'}
              </h3>
            </div>
            <p className="mt-4 text-xs text-muted-foreground" data-oid="c8dreom">
              {health.paymentErrors24h > 0 ? (
                <span className="text-rose-500 font-medium font-medium">
                  {health.paymentErrors24h} sync errors recorded
                </span>
              ) : (
                'All payment events synchronized'
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Storage Usage */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm" data-oid="jdthz:7">
          <CardContent className="p-5" data-oid="ptke9f.">
            <div className="flex justify-between items-start mb-2" data-oid="mqu6nxf">
              <div className="p-2 rounded-lg bg-slate-500/10 text-slate-500" data-oid="g-e-vb-">
                <Gauge className="w-5 h-5" data-oid="k:uh:e6" />
              </div>
            </div>
            <div data-oid="bn-_bai">
              <p className="text-sm font-medium text-muted-foreground" data-oid="lfor1lp">
                Database Size
              </p>
              <h3 className="text-2xl font-bold tracking-tight" data-oid="bl-28tb">
                {health.dbSize}
              </h3>
            </div>
            <p className="mt-4 text-xs text-muted-foreground" data-oid="rq1.dm8">
              Includes all tables and indexes
            </p>
          </CardContent>
        </Card>

        {/* Global Error Monitoring */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm" data-oid="xjpu4wi">
          <CardContent className="p-5" data-oid="-r380ov">
            <div className="flex justify-between items-start mb-2" data-oid="y8z--40">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500" data-oid="_ik4fod">
                <AlertCircle className="w-5 h-5" data-oid="pyad4-k" />
              </div>
              {health.errors24h > 0 && (
                <Badge variant="destructive" className="animate-pulse" data-oid="jwgr10c">
                  {health.errors24h} Total Logs
                </Badge>
              )}
            </div>
            <div data-oid="_873vcz">
              <p className="text-sm font-medium text-muted-foreground" data-oid="mv8onah">
                System Errors (24h)
              </p>
              <h3 className="text-2xl font-bold tracking-tight" data-oid="81fmrco">
                {health.errors24h}
              </h3>
            </div>
            <p className="mt-4 text-xs text-muted-foreground" data-oid="c8dreom">
              {health.warnings24h} general warnings recorded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Logs & Maintenance */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm" data-oid="5bp1-hy">
        <CardHeader data-oid="f4:dvat">
          <div className="flex items-center justify-between" data-oid="8.hdj1m">
            <CardTitle
              className="text-base font-semibold flex items-center gap-2"
              data-oid="19skzko"
            >
              <ShieldCheck className="w-4 h-4 text-primary" data-oid="jrm3myk" />
              System Operations
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6" data-oid="u.-ky2u">
          <div
            className="flex items-center justify-between p-4 border rounded-xl bg-muted/20"
            data-oid="vvqorn8"
          >
            <div className="space-y-1" data-oid="9ads_.h">
              <Label className="text-base font-bold" data-oid="7bkcv9d">
                Maintenance Mode
              </Label>
              <p className="text-xs text-muted-foreground max-w-md" data-oid="g3d26od">
                Restrict access to the platform for non-admin users. Useful during large data
                migrations.
              </p>
            </div>
            <div className="flex items-center gap-3" data-oid="9eaj5mc">
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              <Switch
                checked={maintenanceMode}
                onCheckedChange={onToggleMaintenance}
                disabled={isUpdating}
              />
            </div>
          </div>

          {health.errors24h > 0 && errorLog.length > 0 && (
            <div className="space-y-3" data-oid="tex_4-y">
              <h4
                className="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                data-oid="n4s7tpv"
              >
                Recent Alerts
              </h4>
              <div className="space-y-2" data-oid="j.eh.7-">
                {errorLog.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-rose-500/5 border border-rose-500/10"
                    data-oid="o.amb4i"
                  >
                    <AlertCircle
                      className="w-4 h-4 text-rose-500 mt-0.5 shrink-0"
                      data-oid="olu5it6"
                    />

                    <div className="space-y-0.5" data-oid="t7thncl">
                      <p className="text-sm font-medium text-foreground" data-oid="3oyrf0g">
                        {log.message}
                      </p>
                      <p
                        className="text-xs text-muted-foreground flex items-center gap-2"
                        data-oid="_w7:dyq"
                      >
                        <span data-oid="9:fzsba">{log.component}</span>
                        <span data-oid="pdva-rk">•</span>
                        <span data-oid=":fm-3p:">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </span>
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
  );
};

export default SystemHealthDashboard;
