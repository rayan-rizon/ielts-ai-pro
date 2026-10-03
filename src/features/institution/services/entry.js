import { getRequestedDestination } from '@/features/auth/utils/authDestination';
export function institutionDestination(location) {
  const destination = getRequestedDestination(location, '/institution');
  const pathname = destination.split(/[?#]/)[0];
  return pathname === '/institution' || pathname === '/institution/accept'
    ? destination
    : '/institution';
}
