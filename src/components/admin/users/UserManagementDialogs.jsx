import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Lock, Mail, Send, Users, Wand2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, AdminButton } from '../ui/primitives';

const FIELD_INPUT =
  'h-9 rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium';
const FIELD_LABEL = cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-1.5 block');

export const WarningDialog = ({
  open,
  onOpenChange,
  selectedCount,
  days,
  onDaysChange,
  sending,
  onSend,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="bg-white dark:bg-[#131315] border border-stone-200/90 dark:border-white/10 w-[95vw] max-w-md rounded-lg overflow-hidden shadow-xl p-4 sm:p-5">
      <DialogHeader className="space-y-0.5">
        <DialogTitle className="flex items-center gap-2 text-base font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
          <Mail className="w-4 h-4 text-[rgb(var(--signal-warn))]" /> Send inactivity warning
        </DialogTitle>
        <DialogDescription className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
          Send warning emails to {selectedCount} selected user(s)
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2 py-2">
        <Label className={FIELD_LABEL}>Days until deletion</Label>
        <Input
          type="number"
          min={7}
          max={90}
          value={days}
          onChange={(event) => onDaysChange(parseInt(event.target.value) || 14)}
          className={FIELD_INPUT}
        />
        <p className="text-[11px] text-stone-500 dark:text-stone-400">
          Users are warned their account may be deleted if they don&apos;t log in within this many
          days.
        </p>
      </div>
      <DialogFooter className="gap-2 flex-col sm:flex-row">
        <AdminButton variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </AdminButton>
        <AdminButton
          onClick={onSend}
          disabled={sending}
          loading={sending}
          className="bg-[rgb(var(--signal-warn))] hover:opacity-90 text-white"
        >
          <Send className="w-3.5 h-3.5" />
          {sending ? 'Sending…' : 'Send warnings'}
        </AdminButton>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const generatePassword = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const TextField = ({ label, icon: Icon, ...inputProps }) => (
  <div>
    <Label className={FIELD_LABEL}>{label}</Label>
    <div className="relative">
      <Icon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
      <Input {...inputProps} className={cn(FIELD_INPUT, 'pl-8')} />
    </div>
  </div>
);

const PasswordField = ({ value, onChange, onGenerate }) => (
  <div>
    <Label className={FIELD_LABEL}>Initial password</Label>
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(FIELD_INPUT, 'pl-8')}
          placeholder="Generate or type…"
        />
      </div>
      <AdminButton
        type="button"
        variant="outline"
        onClick={() => onGenerate(generatePassword())}
        className="h-9 w-9 px-0"
        title="Generate strong password"
      >
        <Wand2 className="w-3.5 h-3.5" />
      </AdminButton>
    </div>
    <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-1.5')}>
      8+ chars, uppercase, lowercase, number, special character.
    </p>
  </div>
);

const AccountSelects = ({ user, isAdmin, onChange }) => (
  <div className="grid grid-cols-2 gap-3">
    <div>
      <Label className={FIELD_LABEL}>Subscription</Label>
      <Select
        value={user.subscription_tier}
        onValueChange={(value) => onChange('subscription_tier', value)}
      >
        <SelectTrigger className={FIELD_INPUT}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="free">Free</SelectItem>
          <SelectItem value="pro">Pro</SelectItem>
          <SelectItem value="premium">Premium</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <Label className={FIELD_LABEL}>Role</Label>
      <Select value={user.role} onValueChange={(value) => onChange('role', value)}>
        <SelectTrigger className={FIELD_INPUT}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="user">User</SelectItem>
          {isAdmin && <SelectItem value="admin">Admin</SelectItem>}
        </SelectContent>
      </Select>
    </div>
  </div>
);

export const UserEditorDialog = ({
  creating,
  editingUser,
  newUser,
  isAdmin,
  loading,
  onCreatingChange,
  onEditingChange,
  onNewUserChange,
  onCreate,
  onUpdate,
}) => {
  const activeUser = editingUser || newUser;
  const updateUser = (field, value) => {
    if (editingUser) onEditingChange({ ...editingUser, [field]: value });
    else onNewUserChange({ ...newUser, [field]: value });
  };
  const close = () => {
    onCreatingChange(false);
    onEditingChange(null);
  };
  const submit = () => (editingUser ? onUpdate(editingUser.id, editingUser) : onCreate());

  if (!creating && !editingUser) return null;
  return (
    <Dialog open onOpenChange={close}>
      <DialogContent className="bg-white dark:bg-[#131315] border border-stone-200/90 dark:border-white/10 w-[95vw] max-w-md rounded-lg overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto p-4 sm:p-5">
        <DialogHeader className="space-y-0.5">
          <DialogTitle className="text-base font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
            {creating ? 'Create user' : 'Edit user'}
          </DialogTitle>
          <DialogDescription className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
            {creating
              ? 'Add a new user to the platform'
              : 'Update user information and permissions'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <TextField
            label="Email"
            icon={Mail}
            type="email"
            disabled={!!editingUser}
            value={activeUser.email}
            onChange={(event) => updateUser('email', event.target.value)}
            placeholder="user@example.com"
          />
          {creating && (
            <PasswordField
              value={newUser.password}
              onChange={(value) => updateUser('password', value)}
              onGenerate={(value) => updateUser('password', value)}
            />
          )}
          <TextField
            label="Name"
            icon={Users}
            value={activeUser.full_name}
            onChange={(event) => updateUser('full_name', event.target.value)}
            placeholder="Full name"
          />
          <AccountSelects user={activeUser} isAdmin={isAdmin} onChange={updateUser} />
        </div>
        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <AdminButton variant="ghost" onClick={close}>
            Cancel
          </AdminButton>
          <AdminButton
            onClick={submit}
            disabled={loading || (!editingUser && !newUser.email)}
            loading={loading}
          >
            {loading ? 'Processing…' : creating ? 'Create user' : 'Update user'}
          </AdminButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
