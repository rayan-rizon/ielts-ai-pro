import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Bell, Loader2, Save } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const AnnouncementMessageArea = ({ value, onChange }) => (
  <div className="space-y-2" data-oid="v9y8784">
    <Label className="text-sm font-bold" data-oid="f_53kuq">
      Announcement Message
    </Label>
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter your message here..."
      className="bg-muted/10 border-border/40 focus-visible:ring-primary/20 rounded-xl font-medium min-h-[120px] resize-none"
      data-oid="g93m0iv"
    />
  </div>
);

const SeveritySelector = ({ value, onChange }) => {
  const types = [
    {
      id: 'info',
      label: 'Info',
      color: 'bg-blue-500',
      border: 'border-blue-500',
    },
    {
      id: 'warning',
      label: 'Warning',
      color: 'bg-amber-500',
      border: 'border-amber-500',
    },
    {
      id: 'error',
      label: 'Critical',
      color: 'bg-rose-500',
      border: 'border-rose-500',
    },
  ];

  return (
    <div className="space-y-2" data-oid="2j7mzsl">
      <Label className="text-sm font-bold" data-oid="6inuigl">
        Severity Level
      </Label>
      <div className="grid grid-cols-3 gap-3" data-oid="9bi6tw5">
        {types.map((type) => (
          <button
            key={type.id}
            onClick={() => onChange(type.id)}
            className={`flex items-center justify-center gap-2 h-10 rounded-xl border-2 transition-all font-bold text-xs ${
              value === type.id
                ? `${type.border} bg-muted text-foreground`
                : 'border-border/30 text-muted-foreground hover:border-border/60 hover:bg-muted/5'
            }`}
            data-oid="u-izzt9"
          >
            <div className={`w-2 h-2 rounded-full ${type.color}`} data-oid="ox8-hqa" />
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function AnnouncementsSettingsTab({
  announcement,
  saving,
  onSave,
  onChangeAnnouncement,
}) {
  return (
    <motion.div variants={itemVariants} className="max-w-3xl" data-oid="uac6lhm">
      <Card
        className="border border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm"
        data-oid="inzo-eu"
      >
        <CardHeader className="border-b border-border/40 bg-muted/20" data-oid="vqhmug2">
          <div className="flex items-center gap-2" data-oid="ms21nis">
            <Bell className="h-5 w-5 text-primary" data-oid="x-ix.j:" />
            <CardTitle data-oid="h.:69mu">Public Announcements</CardTitle>
          </div>
          <CardDescription data-oid="0egbc:5">
            Display a persistent message banner to all users
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6" data-oid="bx4fxoj">
          <div className="flex items-center justify-between" data-oid="mr-n0yy">
            <div className="space-y-0.5" data-oid="gx--735">
              <Label className="text-base font-bold" data-oid="nv.hqnz">
                Banner Status
              </Label>
              <p className="text-sm text-muted-foreground" data-oid="_6xzwa4">
                {announcement?.enabled ? 'Active and visible to all users' : 'Currently hidden'}
              </p>
            </div>
            <Switch
              checked={announcement?.enabled}
              onCheckedChange={(checked) =>
                onChangeAnnouncement({
                  ...announcement,
                  enabled: checked,
                })
              }
              disabled={saving}
              data-oid="cux9ifg"
            />
          </div>

          <AnimatePresence mode="wait" data-oid="-v0_clc">
            {announcement?.enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6 overflow-hidden pt-4"
                data-oid="i8h1euj"
              >
                <AnnouncementMessageArea
                  value={announcement?.message}
                  onChange={(msg) =>
                    onChangeAnnouncement({
                      ...announcement,
                      message: msg,
                    })
                  }
                />

                <SeveritySelector
                  value={announcement?.type}
                  onChange={(type) =>
                    onChangeAnnouncement({
                      ...announcement,
                      type: type,
                    })
                  }
                />

                <div className="pt-2" data-oid="54kxmbi">
                  <Button
                    onClick={() => onSave('public_announcement', announcement)}
                    disabled={saving}
                    className="w-full h-12 font-bold rounded-xl shadow-sm"
                    data-oid="z-0hyv6"
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" data-oid="owsndy1" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" data-oid=":8v-smi" />
                    )}
                    Update Announcement
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
