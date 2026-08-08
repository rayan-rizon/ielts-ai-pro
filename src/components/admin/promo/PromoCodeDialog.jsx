import { m } from 'framer-motion';
import { Calendar, Percent, Ticket, Timer, Users } from 'lucide-react';
import { format } from 'date-fns';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/cn';
import { MICRO, AdminButton } from '../ui/primitives';

const FIELD_LABEL = cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-1.5 block');
const FIELD_INPUT =
  'h-10 rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium';

const NumberField = ({ label, icon: Icon, value, onChange, placeholder }) => (
  <div>
    <Label className={FIELD_LABEL}>{label}</Label>
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
      <Input
        type="number"
        value={value}
        onChange={(event) => onChange(parseInt(event.target.value))}
        placeholder={placeholder}
        className={cn(FIELD_INPUT, 'pl-8')}
      />
    </div>
  </div>
);

const SchemeFields = ({ promo, onChange }) => {
  const handleSchemeChange = (value) => {
    if (value === 'grant') onChange({ ...promo, grants_subscription: 'pro', discount_value: 0 });
    else
      onChange({
        ...promo,
        discount_type: value,
        grants_subscription: null,
        discount_value: value === 'percentage' ? 20 : 10,
      });
  };
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label className={FIELD_LABEL}>Scheme</Label>
        <Select
          value={promo.grants_subscription ? 'grant' : promo.discount_type}
          onValueChange={handleSchemeChange}
        >
          <SelectTrigger className={FIELD_INPUT}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percentage">Percentage off</SelectItem>
            <SelectItem value="fixed">Fixed price</SelectItem>
            <SelectItem value="grant">Grant access</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {promo.grants_subscription ? (
        <div>
          <Label className={FIELD_LABEL}>Target tier</Label>
          <Select
            value={promo.grants_subscription}
            onValueChange={(value) => onChange({ ...promo, grants_subscription: value })}
          >
            <SelectTrigger className={FIELD_INPUT}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pro">Pro tier</SelectItem>
              <SelectItem value="premium">Premium tier</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div>
          <Label className={FIELD_LABEL}>Value</Label>
          <div className="relative">
            {promo.discount_type === 'percentage' ? (
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            ) : (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 dark:text-stone-400 font-bold text-xs">
                $
              </span>
            )}
            <Input
              type="number"
              value={promo.discount_value}
              onChange={(event) =>
                onChange({ ...promo, discount_value: parseInt(event.target.value) })
              }
              placeholder="20"
              className={cn(FIELD_INPUT, 'pl-8')}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const ExpirationField = ({ value, onChange }) => (
  <div>
    <Label className={FIELD_LABEL}>Expires</Label>
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            FIELD_INPUT,
            'w-full flex items-center gap-2 px-3 text-left',
            !value && 'text-stone-500 dark:text-stone-400'
          )}
        >
          <Calendar className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400 shrink-0" />
          {value ? format(new Date(value), 'PP') : 'Pick a date'}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarUI
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(date) => onChange(date ? date.toISOString().split('T')[0] : '')}
          initialFocus
          disabled={(date) => date < new Date() || date < new Date('1900-01-01')}
        />
      </PopoverContent>
    </Popover>
  </div>
);

const LimitsFields = ({ promo, onChange }) => (
  <>
    <div className="grid grid-cols-2 gap-3">
      <ExpirationField
        value={promo.valid_until}
        onChange={(value) => onChange({ ...promo, valid_until: value })}
      />
      {promo.grants_subscription ? (
        <NumberField
          label="Access duration (days)"
          icon={Timer}
          value={promo.subscription_duration_days}
          onChange={(value) => onChange({ ...promo, subscription_duration_days: value || 30 })}
          placeholder="30"
        />
      ) : (
        <NumberField
          label="Usage cap"
          icon={Users}
          value={promo.max_uses}
          onChange={(value) => onChange({ ...promo, max_uses: value })}
          placeholder="100"
        />
      )}
    </div>
    {promo.grants_subscription && (
      <m.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
        <NumberField
          label="Total redemptions"
          icon={Users}
          value={promo.max_uses}
          onChange={(value) => onChange({ ...promo, max_uses: value })}
          placeholder="100"
        />
      </m.div>
    )}
  </>
);

export const PromoCodeDialog = ({
  open,
  onOpenChange,
  promo,
  onPromoChange,
  onCreate,
  campaigns = [],
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="bg-white dark:bg-[#131315] border border-stone-200/90 dark:border-white/10 w-[95vw] max-w-md rounded-lg overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto p-4 sm:p-5">
      <DialogHeader className="space-y-0.5">
        <DialogTitle className="text-base font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
          Create promo code
        </DialogTitle>
        <DialogDescription className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
          Generate a discount rule or direct tier-access code
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div>
          <Label className={FIELD_LABEL}>Promo code</Label>
          <div className="relative">
            <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <Input
              value={promo.code}
              onChange={(event) =>
                onPromoChange({ ...promo, code: event.target.value.toUpperCase() })
              }
              placeholder="SUMMER25"
              className={cn(FIELD_INPUT, 'pl-8 font-mono font-bold uppercase tracking-widest')}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className={FIELD_LABEL}>Internal label</Label>
            <Input
              value={promo.label || ''}
              onChange={(event) => onPromoChange({ ...promo, label: event.target.value })}
              placeholder="August upgrade offer"
              className={FIELD_INPUT}
            />
          </div>
          <div>
            <Label className={FIELD_LABEL}>Campaign owner</Label>
            <Select
              value={promo.marketing_campaign_id || 'none'}
              onValueChange={(value) =>
                onPromoChange({
                  ...promo,
                  marketing_campaign_id: value === 'none' ? '' : value,
                })
              }
            >
              <SelectTrigger className={FIELD_INPUT}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <SchemeFields promo={promo} onChange={onPromoChange} />
        <LimitsFields promo={promo} onChange={onPromoChange} />
      </div>
      <DialogFooter className="gap-2 flex-col sm:flex-row">
        <AdminButton variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </AdminButton>
        <AdminButton onClick={onCreate}>Create promo</AdminButton>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
