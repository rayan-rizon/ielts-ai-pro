import { m, AnimatePresence } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Bell, Save } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, PANEL, AdminButton, FADE_UP, COLLAPSE } from '@/components/admin/ui/primitives';

const SEVERITY_TYPES = [
  { id: 'info', label: 'Info', dot: 'bg-blue-500', ring: 'border-blue-400/60' },
  {
    id: 'warning',
    label: 'Warning',
    dot: 'bg-[rgb(var(--signal-warn))]',
    ring: 'border-[rgb(var(--signal-warn)/0.5)]',
  },
  {
    id: 'error',
    label: 'Critical',
    dot: 'bg-[rgb(var(--signal-fault))]',
    ring: 'border-[rgb(var(--signal-fault)/0.5)]',
  },
];

export default function AnnouncementsSettingsTab({
  announcement,
  saving,
  onSave,
  onChangeAnnouncement,
}) {
  return (
    <m.div variants={FADE_UP} className="max-w-3xl">
      <div className={cn(PANEL, 'overflow-hidden')}>
        <div className="p-4 border-b border-stone-100 dark:border-white/[0.06] flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-stone-100 dark:bg-white/[0.06] text-stone-500 dark:text-stone-300">
            <Bell className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-50">
              Public Announcements
            </h3>
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-0.5')}>
              Persistent message banner shown to every user
            </p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs font-extrabold text-stone-900 dark:text-stone-50">
                Banner status
              </Label>
              <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-0.5')}>
                {announcement?.enabled ? 'Active and visible to all users' : 'Currently hidden'}
              </p>
            </div>
            <Switch
              checked={announcement?.enabled}
              onCheckedChange={(checked) =>
                onChangeAnnouncement({ ...announcement, enabled: checked })
              }
              disabled={saving}
            />
          </div>

          <AnimatePresence mode="wait">
            {announcement?.enabled && (
              <m.div
                variants={COLLAPSE}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-5 overflow-hidden"
              >
                <div>
                  <Label className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-1.5 block')}>
                    Message
                  </Label>
                  <Textarea
                    value={announcement?.message}
                    onChange={(e) =>
                      onChangeAnnouncement({ ...announcement, message: e.target.value })
                    }
                    placeholder="Enter your message here..."
                    className="bg-white dark:bg-[#131315] border-stone-300 dark:border-white/15 rounded-md text-xs font-medium min-h-[100px] resize-none"
                  />
                </div>

                <div>
                  <Label className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-1.5 block')}>
                    Severity
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {SEVERITY_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => onChangeAnnouncement({ ...announcement, type: type.id })}
                        className={cn(
                          'flex items-center justify-center gap-2 h-9 rounded-md border text-xs font-bold transition-colors',
                          announcement?.type === type.id
                            ? cn(
                                type.ring,
                                'bg-stone-50 dark:bg-white/[0.04] text-stone-900 dark:text-stone-50'
                              )
                            : 'border-stone-200 dark:border-white/10 text-stone-500 dark:text-stone-400 hover:border-stone-300 dark:hover:border-white/20'
                        )}
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full', type.dot)} />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <AdminButton
                  onClick={() => onSave('public_announcement', announcement)}
                  loading={saving}
                  className="w-full h-10"
                >
                  <Save className="w-3.5 h-3.5" />
                  Update announcement
                </AdminButton>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </m.div>
  );
}
