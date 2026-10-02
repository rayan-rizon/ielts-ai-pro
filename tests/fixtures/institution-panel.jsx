import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import SubscriptionSection from '../../src/features/settings/components/Sections/SubscriptionSection.jsx';
import InstitutionWorkspace, {
  InstitutionAdmin,
} from '../../src/features/institution/components/InstitutionWorkspace.jsx';
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    {window.institutionFixtureStudent ? (
      <SubscriptionSection
        user={{
          subscription_tier: 'pro',
          personal_subscription: {
            subscription_tier: 'premium',
            subscription_end_date: '2099-01-01T00:00:00Z',
          },
          stripe_customer_id: 'cus_personal',
          stripe_subscription_id: 'sub_personal',
          institution_access: { name: 'IELTS Centre', tier: 'pro', status: 'waiting' },
        }}
        navigate={() => {}}
        handleOpenCustomerPortal={() => {}}
        setShowCancelDialog={() => {}}
      />
    ) : window.institutionFixtureAdmin ? (
      <InstitutionAdmin />
    ) : (
      <InstitutionWorkspace institutionId="school" />
    )}
  </BrowserRouter>
);
