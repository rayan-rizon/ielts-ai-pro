import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Empty } from '@/features/dashboard/components/primitives';
import { Search, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { NativeSelect } from '../NativeSelect';
import { StatusBadge } from '../StatusBadge';
import { Field } from '../formUtils';
import { date } from '../institutionUtils';
import { STATUS_LABELS } from '../../services/history';
import { parseStudentCsv } from '../../services/csv';

function StudentRowActions({ seat, admin, busy, usable, statusActive, act, open }) {
  return (
    <div className="flex items-center justify-end gap-1.5 flex-wrap">
      {seat.status === 'invited' && (
        <>
          <Button
            variant="outline"
            size="sm"
            disabled={busy || !usable(seat) || !statusActive}
            onClick={() =>
              act('invite', {
                seat_id: seat.id,
                email: seat.recipient_email,
                name: seat.recipient_name,
              })
            }
          >
            Resend
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => open('invite', 'Reassign unused seat', { seat })}
          >
            Reassign
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={busy}
            onClick={() => act('cancel', { seat_id: seat.id })}
          >
            Cancel
          </Button>
        </>
      )}
      {admin && (
        <>
          {['active', 'expired'].includes(seat.status) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => open('extend', 'Extend student access', { seat })}
            >
              Extend
            </Button>
          )}
          {seat.status === 'waiting' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => open('release', 'Release waiting seat', { seat })}
            >
              Release
            </Button>
          )}
          {seat.activated_at && seat.status === 'active' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => open('correct', 'Correct seat recipient', { seat })}
            >
              Correct
            </Button>
          )}
          {seat.status !== 'revoked' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => open('revoke', 'Revoke student access', { seat })}
            >
              Revoke
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function getAccessUntilLabel(seat) {
  if (seat.status === 'waiting') {
    return 'After current access';
  }
  if (seat.status === 'invited') {
    return `Accept by ${date(seat.activation_deadline)}`;
  }
  return date(seat.access_until);
}

export function StudentsTab({
  institution,
  seats,
  allocations,
  studentSeats,
  orderId,
  setOrderId,
  open,
  act,
  busy,
  usable,
  search,
  setSearch,
  filter,
  setFilter,
  csv,
  setCsv,
  importResults,
  setImportResults,
  importCsv,
  admin,
}) {
  const statusActive = institution.status === 'active';

  const handleCsvChange = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (file) {
        setCsv(parseStudentCsv(await file.text()));
        setImportResults([]);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Provide access card */}
      <Card className="p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2">
          <span className="h-4 w-1 rounded-full bg-primary dark:bg-[#8f97ff]" />
          <h2 className="text-base font-bold text-foreground">Provide student access</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
          <label className="block text-xs font-semibold text-foreground">
            Seat allocation
            <NativeSelect
              wrapperClassName="mt-1.5"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            >
              <option value="">Choose an allocation</option>
              {allocations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.tier.toUpperCase()} ·{' '}
                  {o.months ? `${o.months} months` : `${o.access_days} days`} ·{' '}
                  {o.source === 'complimentary' ? 'Free seats' : 'Purchased'} ·{' '}
                  {seats.filter((s) => s.order_id === o.id && s.status === 'available').length}{' '}
                  available
                </option>
              ))}
            </NativeSelect>
          </label>
          <div>
            <Button
              disabled={!orderId || busy || !statusActive}
              size="sm"
              className="h-9"
              onClick={() =>
                open('invite', 'Invite student', {
                  description: 'The student signs in and accepts to receive access.',
                })
              }
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Invite student
            </Button>
          </div>
        </div>

        {/* CSV Import */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <Field label="Import CSV (email, name)" hint="Maximum 50 students per batch">
            <input
              type="file"
              className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-foreground hover:file:bg-accent cursor-pointer"
              accept=".csv,text/csv"
              disabled={busy || !statusActive}
              onChange={handleCsvChange}
            />
          </Field>

          {csv && (
            <div className="space-y-3 pt-2">
              <div className="max-h-48 overflow-y-auto rounded-md border border-input bg-background p-3 text-xs">
                {csv.map((r) => (
                  <div
                    key={r.row}
                    className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
                  >
                    <span className="truncate">
                      {r.email}{' '}
                      {r.name && <span className="text-muted-foreground">({r.name})</span>}
                    </span>
                    {r.error ? (
                      <span className="text-destructive font-semibold">{r.error}</span>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        Valid
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={busy || !orderId || !csv.some((r) => !r.error)}
                onClick={importCsv}
              >
                {busy ? 'Sending…' : `Send ${csv.filter((r) => !r.error).length} invitations`}
              </Button>

              {importResults.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {importResults.map((r) => (
                    <div
                      key={r.email}
                      className="flex items-center justify-between text-xs rounded-md p-2 bg-background border border-border"
                    >
                      <span className="truncate">
                        {r.email}: {r.delivery_error || 'Sent'}
                      </span>
                      {r.url && (
                        <a
                          className="text-primary dark:text-[#afb5ff] font-semibold underline ml-2 shrink-0"
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Invitation link
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Student Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="Search students"
            placeholder="Search students"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <NativeSelect
          aria-label="Student status"
          wrapperClassName="w-auto"
          className="w-36 h-9"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {['all', 'invited', 'waiting', 'active', 'expired', 'revoked'].map((x) => (
            <option key={x} value={x}>
              {STATUS_LABELS[x] || x}
            </option>
          ))}
        </NativeSelect>

        <span className="text-xs text-muted-foreground ml-auto font-medium">
          Showing {studentSeats.length} {studentSeats.length === 1 ? 'student' : 'students'}
        </span>
      </div>

      {/* Student Seats Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs [&_td]:px-4 [&_td]:py-3.5 [&_th]:px-4 [&_th]:py-3">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                {['Student', 'Plan', 'Source', 'Status', 'Access until', ''].map((x, n) => (
                  <th key={n}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {studentSeats.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td>
                    <p className="font-bold text-foreground">
                      {s.recipient_name || s.recipient_email}
                    </p>
                    <p className="text-muted-foreground text-[11px]">{s.recipient_email}</p>
                  </td>
                  <td>
                    <Badge
                      variant={s.tier === 'premium' ? 'default' : 'secondary'}
                      className="text-[11px]"
                    >
                      {s.tier === 'premium' ? 'Premium' : 'Pro'}
                    </Badge>
                  </td>
                  <td>
                    <span className="text-xs text-muted-foreground capitalize">
                      {s.source === 'complimentary' ? 'Free grant' : 'Purchased'}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="font-mono tabular-nums text-xs">{getAccessUntilLabel(s)}</td>
                  <td className="text-right">
                    <StudentRowActions
                      seat={s}
                      admin={admin}
                      busy={busy}
                      usable={usable}
                      statusActive={statusActive}
                      act={act}
                      open={open}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {studentSeats.length === 0 && (
            <div className="p-8">
              <Empty
                icon={Users}
                title="No students match this view"
                description="Try clearing search filters or invite new students using an available allocation above."
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default StudentsTab;
