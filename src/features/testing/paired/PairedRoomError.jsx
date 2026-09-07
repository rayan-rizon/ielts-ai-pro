import React, { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  IconChip,
  MICRO,
  MUTED,
  PANEL,
  TITLE,
} from '@/features/dashboard/components/primitives.jsx';
import { AlertCircle, ArrowLeft, RefreshCw, UserX } from 'lucide-react';
import { cn } from '@/lib/cn';

const DATABASE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function PairedRoomError({ error, act, type }) {
  const location = useLocation();
  const { id: routeId } = useParams();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await act('get');
    } catch {
      /* Hook state manages error */
    } finally {
      setRetrying(false);
    }
  };

  const label = type === 'listening' ? 'Listening' : 'Reading';
  const errLower = (error || '').toLowerCase();
  const isInvalidRoom = errLower.includes('invalid room') || errLower.includes('not found');
  const isAuth = errLower.includes('sign in') || errLower.includes('unauthorized');

  const searchParams = new URLSearchParams(location.search);
  const queryTestId = searchParams.get('test-id');
  const validTestId = [queryTestId, routeId].find(
    (candidate) => candidate && DATABASE_ID_PATTERN.test(candidate)
  );
  const soloUrl = validTestId ? `/${type}-test?test-id=${validTestId}` : `/${type}`;

  let title = 'Unable to load study room';
  let message = error || 'Could not connect to this study session.';

  if (isInvalidRoom) {
    title = 'Study room not found';
    message =
      'This study room link is invalid or no longer active. You can continue with solo practice or browse all tests.';
  } else if (isAuth) {
    title = 'Sign in required';
    message = 'Please sign in to your account to participate in paired practice rooms.';
  } else if (errLower.includes('origin')) {
    title = 'Connection error';
    message =
      'Unable to reach the study room service from this address. Check your connection or retry.';
  }

  return (
    <div
      role="alert"
      className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto items-center justify-center p-4 sm:p-6 bg-[#f8f7fd] dark:bg-[#08080a]"
    >
      <div
        className={cn(
          PANEL,
          'w-full max-w-md p-6 sm:p-7 text-center flex flex-col items-center shadow-xs'
        )}
      >
        <div className="mb-3">
          <IconChip
            icon={isInvalidRoom ? UserX : AlertCircle}
            tone="warn"
            size="lg"
            className="h-10 w-10 [&>svg]:h-5 [&>svg]:w-5"
          />
        </div>
        <span className={cn(MICRO, 'text-amber-600 dark:text-amber-400 mb-1')}>
          {isInvalidRoom ? 'Room unavailable' : 'Session error'}
        </span>
        <h2 className={cn(TITLE, 'text-base sm:text-lg mb-2')}>{title}</h2>
        <p className={cn(MUTED, 'text-xs sm:text-sm leading-relaxed mb-6 max-w-sm')}>{message}</p>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
          {!isInvalidRoom && (
            <Button
              onClick={handleRetry}
              disabled={retrying}
              className="w-full sm:flex-1 bg-[#5a63df] text-white hover:bg-[#4d55c7] h-9 text-xs font-semibold gap-1.5"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', retrying && 'animate-spin')} />
              {retrying ? 'Retrying…' : 'Try again'}
            </Button>
          )}
          <Button
            asChild
            variant={isInvalidRoom ? 'default' : 'outline'}
            className={cn(
              'w-full sm:flex-1 h-9 text-xs font-semibold',
              isInvalidRoom
                ? 'bg-[#5a63df] text-white hover:bg-[#4d55c7]'
                : 'border-[#e4e2f0] dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
            )}
          >
            <Link to={soloUrl}>Take test solo</Link>
          </Button>
        </div>

        <div className="mt-4 pt-4 border-t border-[#ebeaf7] dark:border-white/10 w-full flex justify-center">
          <Link
            to={`/${type}`}
            className={cn(
              MICRO,
              'text-slate-500 hover:text-[#5a63df] dark:hover:text-[#afb5ff] transition-colors flex items-center gap-1'
            )}
          >
            <ArrowLeft className="h-3 w-3" />
            Back to {label} tests
          </Link>
        </div>
      </div>
    </div>
  );
}
