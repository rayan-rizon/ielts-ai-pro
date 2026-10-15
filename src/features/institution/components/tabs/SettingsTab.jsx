import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Text } from '../formUtils';
import InstitutionBrand from '../InstitutionBrand';
import { Panel, PanelTitle, MUTED } from '@/features/dashboard/components/primitives.jsx';
import {
  uploadInstitutionLogo,
  removeInstitutionLogo,
  validateInstitutionLogo,
} from '../../services/branding';

export function SettingsTab({ institution, act, busy }) {
  const [file, setFile] = useState(null);
  const [removed, setRemoved] = useState(false);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = (e) => {
    const selected = e.target.files?.[0];
    e.target.value = '';
    if (!selected) return;
    try {
      validateInstitutionLogo(selected);
      setFile(selected);
      setRemoved(false);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy || saving || error) return;
    const fields = Object.fromEntries(new FormData(e.currentTarget));
    setSaving(true);
    let uploaded;
    let committed = false;
    try {
      if (file) uploaded = await uploadInstitutionLogo(institution.id, file);
      const logo = uploaded || (removed ? '' : institution.logo_url || '');
      const result = await act('update', { ...fields, logo_url: logo });
      if (result === null) {
        if (uploaded) await removeInstitutionLogo(institution.id, uploaded);
        return;
      }
      committed = true;
      if (institution.logo_url !== logo)
        await removeInstitutionLogo(institution.id, institution.logo_url);
      setFile(null);
      setRemoved(false);
      setError('');
    } catch (err) {
      if (uploaded && !committed) await removeInstitutionLogo(institution.id, uploaded);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form key={institution.updated_at} className="space-y-5" onSubmit={handleSubmit}>
      <Panel className="p-5 sm:p-6 gap-4">
        <PanelTitle label="Student sidebar branding" />
        <p className={`${MUTED} text-xs`}>
          Add your institution’s logo to your students’ sidebar. IELTS AI Pro attribution stays
          visible.
        </p>
        <InstitutionBrand
          variant="sidebar"
          institution={{
            name: institution.name,
            logo_url: preview || (removed ? '' : institution.logo_url),
          }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="space-y-1.5 min-w-0">
            <span className="block text-xs font-semibold">Institution logo</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              aria-label="Institution logo"
              disabled={busy || saving}
              onChange={handleFile}
              className="block w-full max-w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-[#5a63df] file:px-3 file:py-2 file:font-semibold file:text-white"
            />
          </label>
          {(file || (!removed && institution.logo_url)) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy || saving}
              onClick={() => {
                setFile(null);
                setRemoved(true);
                setError('');
              }}
            >
              Remove logo
            </Button>
          )}
        </div>
        <p className={`${MUTED} text-xs wrap-anywhere`}>
          {file ? `${file.name} · ` : ''}PNG, JPG or WebP · Up to 2 MB. Changes appear after saving.
        </p>
        {error && (
          <p role="alert" className="text-xs text-[rgb(var(--signal-fault))]">
            {error}
          </p>
        )}
      </Panel>
      <fieldset disabled={busy || saving}>
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
            <Button disabled={busy || saving || !!error} size="sm">
              {saving ? 'Saving…' : 'Save details'}
            </Button>
          </div>
        </Card>
      </fieldset>
    </form>
  );
}

export default SettingsTab;
