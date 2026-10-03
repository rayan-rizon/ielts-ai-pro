import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PRICING_LABELS, STATUS_LABELS } from '../services/history';
import { NativeSelect } from './NativeSelect';
import { Field, Text, Select } from './formUtils';

function CreateFields() {
  return (
    <div className="space-y-2.5">
      <Text
        label="Institution name"
        name="name"
        required
        placeholder="e.g. Oxford English Academy"
      />
      <div className="grid grid-cols-2 gap-2.5">
        <Text
          label="Owner email"
          name="owner_email"
          type="email"
          required
          placeholder="owner@academy.org"
        />
        <Text
          label="Contact email"
          name="contact_email"
          type="email"
          placeholder="contact@academy.org"
        />
      </div>
      <Text
        label="Currency"
        name="currency"
        value="USD"
        required
        pattern="[A-Z]{3}"
        placeholder="USD"
      />
    </div>
  );
}

function UpdateFields({ institution }) {
  return (
    <div className="space-y-2.5">
      <Text label="Institution name" name="name" value={institution.name} required />
      <div className="grid grid-cols-2 gap-2.5">
        <Text
          label="Owner email"
          name="owner_email"
          value={institution.owner_email}
          type="email"
          required
        />
        <Text
          label="Currency"
          name="currency"
          value={institution.currency}
          pattern="[A-Z]{3}"
          required
        />
      </div>
      <Select label="Status" name="status" value={institution.status}>
        {['active', 'suspended', 'archived'].map((x) => (
          <option key={x} value={x}>
            {STATUS_LABELS[x] || x}
          </option>
        ))}
      </Select>
    </div>
  );
}

function GrantFields() {
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <Select label="Plan" name="tier">
          <option value="pro">Pro Plan</option>
          <option value="premium">Premium Plan</option>
        </Select>
        <Text label="Seats" name="quantity" type="number" min="1" max="10000" value="5" required />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Text
          label="Access days"
          name="access_days"
          type="number"
          min="1"
          max="3650"
          value="30"
          required
        />
        <Text
          label="Activate by"
          name="activation_deadline"
          type="date"
          value={new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)}
          required
        />
      </div>
    </div>
  );
}

function getPricingDescription(kind) {
  if (kind === 'default') {
    return 'Standard price for any institution without a custom negotiated rate.';
  }
  if (kind === 'bulk') {
    return 'Applies to all seats in an order once the threshold quantity is met.';
  }
  if (kind === 'package') {
    return 'Sets a fixed package total for this plan, duration, and seat count.';
  }
  return 'Negotiated price per seat for this specific institution only.';
}

function PricingFields({ institution, pricing, kind, setKind }) {
  const allowedKinds = institution
    ? ['default', 'bulk', 'override', 'package']
    : ['default', 'bulk'];

  const hasSeatQty = ['bulk', 'package'].includes(kind);

  return (
    <div className="space-y-2.5">
      <Field label="Pricing type">
        <NativeSelect
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          disabled={Boolean(pricing)}
        >
          {allowedKinds.map((x) => (
            <option key={x} value={x}>
              {PRICING_LABELS[x]}
            </option>
          ))}
        </NativeSelect>
      </Field>
      {pricing && <input type="hidden" name="kind" value={kind} />}
      <div className="rounded-lg border border-[#e4e2f0] dark:border-white/10 bg-stone-50/70 dark:bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-muted-foreground leading-snug">
        {getPricingDescription(kind)}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Select label="Plan" name="tier" value={pricing?.tier}>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
        </Select>
        <Select label="Access months" name="months" value={pricing?.months} align="end">
          <option value="1">1 month</option>
          <option value="3">3 months</option>
        </Select>
      </div>

      {hasSeatQty ? (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            <Text
              label="Currency"
              name="currency"
              value={pricing?.currency || institution?.currency || 'USD'}
              pattern="[A-Z]{3}"
              required
            />
            <Text
              label={kind === 'bulk' ? 'Minimum seats' : 'Exact seats'}
              name="quantity"
              type="number"
              min="1"
              value={pricing?.quantity || 1}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Text
              label={kind === 'package' ? 'Package total' : 'Price per seat'}
              name="amount"
              type="number"
              min="0.01"
              step="any"
              value={pricing?.amount}
              required
            />
            <Select
              label="Enabled"
              name="enabled"
              value={String(pricing?.enabled ?? true)}
              align="end"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
          </div>
        </>
      ) : (
        <>
          <input type="hidden" name="quantity" value="1" />
          <div className="grid grid-cols-3 gap-2">
            <Text
              label="Currency"
              name="currency"
              value={pricing?.currency || institution?.currency || 'USD'}
              pattern="[A-Z]{3}"
              required
            />
            <Text
              label="Price per seat"
              name="amount"
              type="number"
              min="0.01"
              step="any"
              value={pricing?.amount}
              required
            />
            <Select
              label="Enabled"
              name="enabled"
              value={String(pricing?.enabled ?? true)}
              align="end"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
          </div>
        </>
      )}
    </div>
  );
}

function InviteFields({ seat }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <Text
        label="Student email"
        name="email"
        type="email"
        value={seat?.recipient_email}
        required
        placeholder="student@example.com"
      />
      <Text
        label="Student name"
        name="name"
        value={seat?.recipient_name}
        placeholder="Optional full name"
      />
    </div>
  );
}

function ReconcileRefundFields({ seats }) {
  return (
    <>
      <p className="text-xs text-muted-foreground">
        Select seats whose access should end. Remaining seats will become allocatable again.
      </p>
      <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-input p-3">
        {seats.map((s) => (
          <label key={s.id} className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="seat_ids" value={s.id} className="rounded" />
            <span className="font-medium text-foreground">
              {s.recipient_email || 'Unused seat'}
            </span>
            <span className="text-muted-foreground">· {s.status}</span>
          </label>
        ))}
      </div>
    </>
  );
}

function ActionContent({ operation, kind, setKind }) {
  const { action, seat, institution, pricing, seats } = operation;
  switch (action) {
    case 'create':
      return <CreateFields />;
    case 'update':
      return <UpdateFields institution={institution} />;
    case 'grant':
      return <GrantFields />;
    case 'pricing':
      return (
        <PricingFields institution={institution} pricing={pricing} kind={kind} setKind={setKind} />
      );
    case 'invite':
      return <InviteFields seat={seat} />;
    case 'extend':
      return <Text label="Access until" name="access_until" type="date" required />;
    case 'correct':
      return <Text label="Correct student email" name="email" type="email" required />;
    case 'reconcile_refund':
      return <ReconcileRefundFields seats={seats || []} />;
    default:
      return null;
  }
}

export function OperationDialog({ operation, onClose, onSubmit, busy }) {
  const [kind, setKind] = useState(operation?.kind || 'override');
  if (!operation) return null;

  const { action } = operation;
  const needsReason = !['invite', 'cancel', 'create'].includes(action);

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      ...Object.fromEntries(form),
      ...(action === 'reconcile_refund' ? { seat_ids: form.getAll('seat_ids') } : {}),
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-2xl border border-border/80 bg-card p-5 text-card-foreground shadow-xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-sm font-extrabold text-foreground">
            {operation.title}
          </DialogTitle>
          <DialogDescription className="text-[11px] text-muted-foreground leading-normal">
            {operation.description ||
              'Changes apply to this institution. Administrative changes are recorded in its history.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-3 space-y-2.5">
          <ActionContent operation={operation} kind={kind} setKind={setKind} />

          {needsReason && (
            <Text
              label="Reason"
              name="reason"
              required
              placeholder="Reason for this change (recorded in history)"
            />
          )}

          <div className="flex items-center justify-end gap-2 border-t border-[#e4e2f0] dark:border-white/10 pt-3 mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-3.5 text-xs font-semibold rounded-lg border border-[#e4e2f0] bg-white text-stone-700 hover:bg-[#f7f6fd] hover:border-[#5a63df]/40 hover:text-[#5a63df] dark:border-white/10 dark:bg-[#141319] dark:text-stone-300 dark:hover:bg-white/5 dark:hover:text-white transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={busy}
              className="h-8 px-4 text-xs font-bold rounded-lg bg-[#5a63df] text-white hover:bg-[#4d55c7] active:scale-[0.98] shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default OperationDialog;
