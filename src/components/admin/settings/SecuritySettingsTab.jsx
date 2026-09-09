import React from 'react';
import { m } from 'framer-motion';
import { FADE_UP } from '@/components/admin/ui/primitives';

import { SecurityLoadingSkeleton, SecurityLoadErrorPanel } from './security/SecurityLoadingStates';
import { SecurityOverviewPanel } from './security/SecurityOverviewPanel';
import { PasskeysSection } from './security/PasskeysSection';
import { AuthenticatorsSection } from './security/AuthenticatorsSection';
import { RecoveryCodesSection } from './security/RecoveryCodesSection';
import { PasswordChangeSection } from './security/PasswordChangeSection';
import { ActiveSessionsSection } from './security/ActiveSessionsSection';
import { useSecuritySettingsTabState } from './security/useSecuritySettingsTabState';

/**
 * SecuritySettingsTab - Administrator security configuration panel.
 */
export default function SecuritySettingsTab({
  passwordData,
  onChangePasswordData,
  changingPassword,
  onPasswordChange,
}) {
  const state = useSecuritySettingsTabState({ passwordData });

  if (state.loading && !state.snapshot) {
    return <SecurityLoadingSkeleton />;
  }

  if (state.loadError && !state.snapshot) {
    return (
      <SecurityLoadErrorPanel
        error={state.loadError}
        onRetry={state.refresh}
        loading={state.loading}
      />
    );
  }

  return (
    <m.div variants={FADE_UP} className="grid max-w-6xl grid-cols-12 gap-3">
      <SecurityOverviewPanel {...state.overviewProps} />

      <PasskeysSection {...state.passkeysProps} />

      <AuthenticatorsSection {...state.authenticatorsProps} />

      <RecoveryCodesSection {...state.recoveryProps} />

      <PasswordChangeSection
        passwordData={passwordData}
        onChangePasswordData={onChangePasswordData}
        changingPassword={changingPassword}
        onPasswordChange={onPasswordChange}
        passwordStrength={state.passwordStrength}
      />

      <ActiveSessionsSection {...state.sessionsProps} />
    </m.div>
  );
}
