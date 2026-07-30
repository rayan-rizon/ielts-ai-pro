import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AIUsageStatsCards from '@/components/admin/ai-usage/AIUsageStatsCards';
import AIUsageTableRow from '@/components/admin/ai-usage/AIUsageTableRow';
import { Table, TableBody } from '@/components/ui/table';

const itemVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };

describe('AI usage analytics UI', () => {
  it('labels provider cost as tracked and reveals incomplete telemetry', () => {
    render(
      <AIUsageStatsCards
        itemVariants={itemVariants}
        loading={false}
        totals={{
          totalRequests: 18,
          completedCalls: 14,
          pendingCalls: 3,
          failedCalls: 1,
          totalCachedCalls: 4,
          totalTokens: 14_200,
          uniqueUsers: 5,
          totalUsers: 22,
          trackedProviderCost: 0.12,
          pricedCompletedCalls: 3,
          unpricedCompletedCalls: 11,
          costTelemetryAvailable: true,
        }}
      />
    );

    expect(screen.getByText('Tracked Provider Cost')).toBeInTheDocument();
    expect(screen.getByText('11 unpriced')).toBeInTheDocument();
    expect(screen.getByText('Awaiting Finalisation')).toBeInTheDocument();
    expect(screen.getByText('1 failed')).toBeInTheDocument();
  });

  it('separates delivered, pending, and unpriced work for each candidate', () => {
    render(
      <Table>
        <TableBody>
          <AIUsageTableRow
            idx={0}
            maxCalls={20}
            row={{
              user: { id: 'candidate-1', full_name: 'Ayesha Rahman', email: 'ayesha@example.com' },
              totalCalls: 20,
              completedCalls: 16,
              pendingCalls: 3,
              failedCalls: 1,
              cachedCalls: 4,
              totalTokens: 20_000,
              trackedProviderCost: 0.08,
              unpricedCompletedCalls: 10,
              hasLifecycleTelemetry: true,
              endpoints: { generateDetailedFeedback: 16 },
              lastActivity: '2026-07-30T14:00:00.000Z',
            }}
          />
        </TableBody>
      </Table>
    );

    expect(screen.getByText('3 pending')).toBeInTheDocument();
    expect(screen.getByText('1 failed')).toBeInTheDocument();
    expect(screen.getByText('10 unpriced')).toBeInTheDocument();
  });
});
