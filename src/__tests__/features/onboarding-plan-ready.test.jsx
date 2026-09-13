import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CompleteStep from '@/features/onboarding/components/steps/CompleteStep';
import { buildOnboardingPlanPreview } from '@/features/onboarding/components/steps/onboardingPlanPreview';

const formData = {
  target_band_score: 7.5,
  estimated_weeks: 10,
  weak_area: 'writing',
  study_availability: {
    version: 1,
    timezone: 'Asia/Dhaka',
    days: { monday: 45, wednesday: 60, saturday: 90 },
  },
};

describe('onboarding plan-ready experience', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('derives the preview from the learner answers without claiming a measured weakness', () => {
    expect(buildOnboardingPlanPreview(formData)).toMatchObject({
      focusLabel: 'Writing',
      targetBand: 7.5,
      weeklyMinutes: 195,
      studyDays: 3,
      timelineLabel: '10-week timeline',
    });
    expect(buildOnboardingPlanPreview(formData).planItems[0]).toEqual({
      label: 'Writing level check',
      detail: 'Starts by measuring your chosen focus before calling it a weakness.',
    });
  });

  it('moves from an engaging assembly state to the free learner subscription offer', () => {
    vi.useFakeTimers();
    const onUpgrade = vi.fn();
    const onContinue = vi.fn();

    const { container } = render(
      <CompleteStep
        formData={formData}
        onUpgrade={onUpgrade}
        onContinue={onContinue}
        onOpenPlan={vi.fn()}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Building your Band 7.5 plan' })
    ).toBeInTheDocument();
    expect(screen.getByText(/matching 195 weekly minutes/i)).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2000));

    expect(screen.getByRole('heading', { name: 'Your study plan is ready' })).toBeInTheDocument();
    expect(screen.getByText('Band 7.5')).toBeInTheDocument();
    expect(screen.getByText('195 min')).toBeInTheDocument();
    expect(screen.getByText('Writing level check')).toBeInTheDocument();
    expect(container.querySelectorAll('.lucide-lock-keyhole')).toHaveLength(3);

    fireEvent.click(screen.getByRole('button', { name: /choose pro/i }));
    fireEvent.click(screen.getByRole('button', { name: /choose premium/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue with free practice/i }));
    expect(onUpgrade).toHaveBeenNthCalledWith(1, 'pro');
    expect(onUpgrade).toHaveBeenNthCalledWith(2, 'premium');
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('sends an existing paid learner straight to the real Learning Path', () => {
    vi.useFakeTimers();
    const onOpenPlan = vi.fn();

    render(
      <CompleteStep
        formData={formData}
        hasPaidPlan
        onUpgrade={vi.fn()}
        onContinue={vi.fn()}
        onOpenPlan={onOpenPlan}
      />
    );
    act(() => vi.advanceTimersByTime(2000));

    expect(screen.queryByRole('button', { name: /choose pro/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /open my ai learning path/i }));
    expect(onOpenPlan).toHaveBeenCalledOnce();
  });

  it('does not advance to the ready state after a failed profile save', () => {
    const source = readFileSync('src/features/onboarding/pages/Onboarding.jsx', 'utf8');

    expect(source).toContain('const saved = await submitData();');
    expect(source).toContain('if (saved) goNext();');
    expect(source).not.toContain('await submitData();\n      goNext();');
    expect(source).toContain(
      'if (hasPaidAccess(updatedUser)) triggerBackgroundPathGeneration(updatedUser);'
    );
    expect(source).not.toContain("toast.success('Preferences saved!'");
  });
});
