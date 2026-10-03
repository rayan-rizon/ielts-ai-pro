import { fromStripeAmount } from '../../../../supabase/functions/_shared/planPricing.ts';

export const date = (value) => (value ? new Date(value).toLocaleDateString() : '—');

export const money = (minor, currency) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(
    fromStripeAmount(minor, currency)
  );

export const TABS = ['overview', 'students', 'subscription', 'billing', 'settings'];
export const ADMIN_TABS = [...TABS, 'pricing', 'history'];

export const TAB_LABELS = {
  overview: 'Overview',
  students: 'Students',
  subscription: 'Buy seats',
  billing: 'Billing',
  settings: 'Settings',
  pricing: 'Pricing',
  history: 'History',
};

export const SEAT_LABELS = {
  available: 'Available seats',
  invited: 'Invitations sent',
  waiting: 'Waiting seats',
  active: 'Active students',
};
