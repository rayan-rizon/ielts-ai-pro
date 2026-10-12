import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { m, motion } from 'framer-motion';
import { Bell, Megaphone, RefreshCcw, Wrench } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import useMaintenanceClock from '@/hooks/useMaintenanceClock';
import { SystemSetting } from '@/features/admin/services/SystemSetting';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  ADMIN_TABS_LIST,
  ADMIN_TAB_TRIGGER,
  AdminButton,
  AdminPageHeader,
  FADE_UP,
  PILL_BASE,
  STAGGER_CONTAINER,
  pillTone,
} from '@/components/admin/ui/primitives';
import {
  isAnnouncementLive,
  isMaintenanceActive,
  isMaintenanceScheduled,
  normalizeAnnouncement,
  normalizeMaintenance,
} from '@/lib/communications';
import BroadcastsPanel from './BroadcastsPanel';
import BannerPanel from './BannerPanel';
import MaintenancePanel from './MaintenancePanel';

const VIEWS = [
  { value: 'broadcasts', label: 'Broadcasts', icon: Bell },
  { value: 'banner', label: 'Site banner', icon: Megaphone },
  { value: 'maintenance', label: 'Maintenance', icon: Wrench },
];

const TAB_CONTENT_VARIANTS = {
  hidden: { opacity: 0, y: 8, filter: 'blur(2px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
  },
};

const ViewTab = ({ view, isActive }) => {
  const Icon = view.icon;
  return (
    <TabsTrigger
      value={view.value}
      className={cn(ADMIN_TAB_TRIGGER, 'relative overflow-visible data-[state=active]:shadow-none')}
    >
      {isActive && (
        <motion.span
          layoutId="communicationsTabActivePill"
          className="absolute inset-0 rounded-md bg-white shadow-2xs dark:bg-[#131315]"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
      <Icon className="relative h-3.5 w-3.5" />
      <span className="relative">{view.label}</span>
    </TabsTrigger>
  );
};

/**
 * Communications — one home for everything the platform says globally.
 *
 * Broadcasts lived under their own "Notifications" tab while the site banner
 * sat three clicks away under Settings → Announcements, with a different
 * severity vocabulary and no shared scheduling or audience concepts. Both, plus
 * maintenance mode, now share one module and one vocabulary, because from an
 * operator's point of view they are the same decision: what do we tell users,
 * and who do we tell?
 */
export default function CommunicationsCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedView = searchParams.get('view');
  const activeView = VIEWS.some((view) => view.value === requestedView)
    ? requestedView
    : 'broadcasts';

  const { refreshGlobalSettings } = useAuth();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await SystemSetting.getAll();
      setSettings(data || {});
    } catch (error) {
      console.error('Error loading communication settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (key, value) => {
    try {
      setSaving(true);
      await SystemSetting.set(key, value);
      setSettings((prev) => ({ ...prev, [key]: value }));
      // Apply the change to this admin's own session immediately rather than
      // waiting for the periodic settings poll.
      refreshGlobalSettings?.();
      toast.success('Saved');
      return true;
    } catch (error) {
      console.error('Error saving setting:', error);
      toast.error(error.message || 'Failed to save');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleViewChange = (value) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set('view', value);
        return params;
      },
      { replace: true }
    );
  };

  const maintenance = normalizeMaintenance(settings.maintenance_mode);
  const now = useMaintenanceClock(maintenance);
  const announcement = normalizeAnnouncement(settings.public_announcement);

  const maintenanceStatus = isMaintenanceActive(maintenance, now)
    ? { tone: 'fault', label: 'Maintenance on' }
    : isMaintenanceScheduled(maintenance, now)
      ? { tone: 'warn', label: 'Maintenance scheduled' }
      : null;
  const bannerLive = isAnnouncementLive(announcement, { isAuthenticated: true, tier: 'free' });

  return (
    <m.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-[1700px] space-y-4 pb-10 pt-12 md:pt-0"
    >
      <m.div variants={FADE_UP}>
        <AdminPageHeader
          title="Communications"
          description="Broadcasts, the site-wide banner, and maintenance mode — everything the platform says to users"
          tip="Each surface has its own reach: broadcasts land in the learner notification panel, the banner sits above every page, and maintenance mode replaces the site entirely."
        >
          {maintenanceStatus && (
            <span className={cn(PILL_BASE, pillTone(maintenanceStatus.tone))}>
              {maintenanceStatus.label}
            </span>
          )}
          {bannerLive && <span className={cn(PILL_BASE, pillTone('accent'))}>Banner live</span>}
          <AdminButton variant="outline" onClick={load}>
            <RefreshCcw className={cn('h-3 w-3', loading && 'animate-spin')} />
            Refresh
          </AdminButton>
        </AdminPageHeader>
      </m.div>

      <Tabs value={activeView} onValueChange={handleViewChange} className="w-full space-y-4">
        <div className="scrollbar-thin flex overflow-x-auto pb-1">
          <TabsList className={ADMIN_TABS_LIST}>
            {VIEWS.map((view) => (
              <ViewTab key={view.value} view={view} isActive={activeView === view.value} />
            ))}
          </TabsList>
        </div>

        <TabsContent value="broadcasts">
          <m.div variants={TAB_CONTENT_VARIANTS} initial="hidden" animate="visible">
            <BroadcastsPanel />
          </m.div>
        </TabsContent>

        <TabsContent value="banner">
          <m.div variants={TAB_CONTENT_VARIANTS} initial="hidden" animate="visible">
            <BannerPanel value={settings.public_announcement} saving={saving} onSave={handleSave} />
          </m.div>
        </TabsContent>

        <TabsContent value="maintenance">
          <m.div variants={TAB_CONTENT_VARIANTS} initial="hidden" animate="visible">
            <MaintenancePanel
              value={settings.maintenance_mode}
              saving={saving}
              onSave={handleSave}
            />
          </m.div>
        </TabsContent>
      </Tabs>
    </m.div>
  );
}
