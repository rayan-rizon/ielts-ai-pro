import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Loader2, Save } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function SecuritySettingsTab({
  passwordData,
  onChangePasswordData,
  changingPassword,
  onPasswordChange,
}) {
  return (
    <motion.div variants={itemVariants} className="max-w-3xl" data-oid="yo-z56e">
      <Card
        className="border border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm"
        data-oid="a24fl33"
      >
        <CardHeader className="border-b border-border/40 bg-muted/20" data-oid="8k9ymtq">
          <div className="flex items-center gap-2" data-oid="lpefb_:">
            <Lock className="h-5 w-5 text-primary" data-oid="8dv0bn:" />
            <CardTitle data-oid="ebovjjb">Security Settings</CardTitle>
          </div>
          <CardDescription data-oid="demtlp7">
            Manage your account security and authentication credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6" data-oid="xy3w520">
          <div className="space-y-4" data-oid="uup1w.x">
            <h3
              className="text-sm font-bold uppercase tracking-wider text-muted-foreground"
              data-oid="ki0_c5t"
            >
              Change Password
            </h3>
            <div className="space-y-4" data-oid="yqhhj90">
              <div className="space-y-2" data-oid="0o.3ztg">
                <Label htmlFor="current-password" data-oid="d7zo54h">
                  Current Password
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    onChangePasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  className="bg-muted/10"
                  placeholder="Enter current password"
                  data-oid="o9:pk2b"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4" data-oid="7em9c2z">
                <div className="space-y-2" data-oid="tcj0097">
                  <Label htmlFor="new-password" data-oid="x4xox-h">
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      onChangePasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    className="bg-muted/10"
                    placeholder="Enter new password"
                    data-oid="_w01w1n"
                  />
                </div>
                <div className="space-y-2" data-oid="oi5qy0_">
                  <Label htmlFor="confirm-password" data-oid="x:d0joa">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      onChangePasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    className="bg-muted/10"
                    placeholder="Confirm new password"
                    data-oid="-ji1r4t"
                  />
                </div>
              </div>
            </div>
            <div className="pt-2 flex justify-end" data-oid="xyy0wpq">
              <Button
                onClick={onPasswordChange}
                disabled={
                  changingPassword || !passwordData.currentPassword || !passwordData.newPassword
                }
                className="font-bold rounded-xl shadow-sm"
                data-oid="fr.6_.8"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" data-oid="c:gptn5" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" data-oid="giyn:qt" />
                    Update Password
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
