import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Text } from '../formUtils';

export function SettingsTab({ institution, act, busy }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    act('update', Object.fromEntries(new FormData(e.currentTarget)));
  };

  return (
    <form key={institution.updated_at} className="space-y-5" onSubmit={handleSubmit}>
      <Card className="p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2">
          <span className="h-4 w-1 rounded-full bg-primary dark:bg-[#8f97ff]" />
          <h2 className="text-base font-bold text-foreground">Institution details</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Name" name="name" value={institution.name} required />
          <Text
            label="Contact email"
            name="contact_email"
            type="email"
            value={institution.contact_email}
          />
          <Text label="Contact phone" name="contact_phone" value={institution.contact_phone} />
          <Text
            label="Logo URL"
            name="logo_url"
            type="url"
            value={institution.logo_url}
            placeholder="https://…"
          />
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-3.5 text-xs flex flex-wrap items-center justify-between gap-3 text-muted-foreground">
          <span>
            Owner account: <strong className="text-foreground">{institution.owner_email}</strong>
          </span>
          <span>
            Billing Currency:{' '}
            <span className="font-mono font-bold text-foreground">{institution.currency}</span>
          </span>
        </div>

        <div className="pt-2">
          <Button disabled={busy} size="sm">
            Save details
          </Button>
        </div>
      </Card>
    </form>
  );
}

export default SettingsTab;
