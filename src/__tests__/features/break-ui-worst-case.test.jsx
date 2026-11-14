import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getInitials } from '@/lib/format';
import { buildStatBandModel } from '@/features/dashboard/components/statBandModel';
import { PILL_BASE, Pill } from '@/features/dashboard/components/primitives';
import LeaderboardRow from '@/features/gamification/components/LeaderboardRow';
import Podium from '@/features/gamification/components/Podium';
import SessionLog from '@/features/dashboard/components/SessionLog';
import DashboardHeader from '@/features/dashboard/components/DashboardHeader';
import GoalsSection from '@/features/settings/components/Sections/GoalsSection';

describe('Break-UI Worst-Case Stress Tests', () => {
  describe('Initials & Unicode Grapheme Safety', () => {
    it('handles emoji-first names without surrogate pair truncation or mojibake', () => {
      expect(getInitials('🦊 Fox')).toBe('🦊F');
      expect(getInitials('👩🏽‍💻 Priya')).toBe('👩🏽‍💻P');
    });

    it('handles multi-word names with suffixes (e.g. Montgomery III -> CM)', () => {
      expect(getInitials('Christopher Alexander Montgomery III')).toBe('CM');
      expect(getInitials('Robert Downey Jr.')).toBe('RD');
    });

    it('handles leading, trailing, and repeated whitespace without empty initials', () => {
      expect(getInitials('   Sam   Lee  ')).toBe('SL');
      expect(getInitials('   Jo   ')).toBe('J');
    });

    it('handles CJK and non-space scripts', () => {
      expect(getInitials('王秀英')).toBe('王');
    });

    it('falls back gracefully on empty, null, or undefined names', () => {
      expect(getInitials('')).toBe('U');
      expect(getInitials('   ')).toBe('U');
      expect(getInitials(null)).toBe('U');
      expect(getInitials(undefined)).toBe('U');
    });
  });

  describe('StatBand Model Plurals & Thousands Formatting', () => {
    it('uses singular "day" when daysToExam is exactly 1', () => {
      const stats = { avgScore: 6.5, measuredTests: 5 };
      const user = { test_date: new Date(Date.now() + 86400000).toISOString() }; // 1 day ahead
      const tiles = buildStatBandModel(stats, [], user);
      const examTile = tiles.find((t) => t.key === 'exam');

      expect(examTile.unit).toBe('day');
    });

    it('formats thousands separator on large daysToExam', () => {
      const stats = { avgScore: 6.5, measuredTests: 5 };
      // ~1000 days ahead
      const user = { test_date: new Date(Date.now() + 1000 * 86400000).toISOString() };
      const tiles = buildStatBandModel(stats, [], user);
      const examTile = tiles.find((t) => t.key === 'exam');

      expect(examTile.unit).toBe('days');
      expect(examTile.value).toMatch(/^[1-9]\d{0,2}(,\d{3})+$/);
    });

    it('uses singular "test" when measuredTests is 1', () => {
      const stats = { avgScore: 6.5, measuredTests: 1 };
      const tiles = buildStatBandModel(stats, [], null);
      const averageTile = tiles.find((t) => t.key === 'average');

      expect(averageTile.sub).toBe('across 1 test');
    });

    it('uses plural "tests" when measuredTests is greater than 1', () => {
      const stats = { avgScore: 6.5, measuredTests: 4 };
      const tiles = buildStatBandModel(stats, [], null);
      const averageTile = tiles.find((t) => t.key === 'average');

      expect(averageTile.sub).toBe('across 4 tests');
    });
  });

  describe('Leaderboard & Podium Null Defense', () => {
    it('renders LeaderboardRow safely when user.points is undefined or null', () => {
      const user = {
        id: 'u1',
        name: 'Aleksandra Wiśniewska-Kowalczyk',
        rank: 1284,
        points: undefined,
        bandScore: '7.5',
        streak: 3,
      };

      expect(() => {
        render(
          <BrowserRouter>
            <LeaderboardRow user={user} isCurrentUser={false} rank={1284} />
          </BrowserRouter>
        );
      }).not.toThrow();

      expect(screen.getByText(/0/)).toBeInTheDocument();
      expect(screen.getByText('1,284')).toBeInTheDocument();
    });

    it('renders Podium safely when top user points is undefined or null', () => {
      const topThree = [
        { id: 'u1', name: '🦊 Fox', points: null, bandScore: '8.0', streak: 5 },
        { id: 'u2', name: 'Jo', points: 1200, bandScore: '7.0', streak: 2 },
      ];

      expect(() => {
        render(<Podium topThree={topThree} />);
      }).not.toThrow();

      expect(screen.getByText('🦊F')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Pills & Primitives Sturdiness', () => {
    it('enforces whitespace-nowrap and shrink-0 on PILL_BASE', () => {
      expect(PILL_BASE).toContain('whitespace-nowrap');
      expect(PILL_BASE).toContain('shrink-0');
    });

    it('renders Pill without collapsing or splitting text', () => {
      render(<Pill tone="accent">You</Pill>);
      const pill = screen.getByText('You');
      expect(pill.className).toContain('whitespace-nowrap');
      expect(pill.className).toContain('shrink-0');
    });
  });

  describe('SessionLog Pluralization & Acronym Integrity', () => {
    it('renders singular "session" in footnote when rows.length is 1', () => {
      const singleTest = [
        {
          id: 'test-1',
          test_type: 'reading',
          score: 7.5,
          duration_seconds: 300,
          completed_at: new Date().toISOString(),
          passage: { title: 'IELTS Cambridge 19 Academic Test 1' },
        },
      ];

      render(
        <TooltipProvider>
          <BrowserRouter>
            <SessionLog recentTests={singleTest} />
          </BrowserRouter>
        </TooltipProvider>
      );

      expect(screen.getByText(/session/)).toBeInTheDocument();
      expect(screen.getByText('IELTS Cambridge 19 Academic Test 1')).toBeInTheDocument();
    });
  });

  describe('GoalsSection Null Safety', () => {
    it('does not throw when formData.target_band_score is null or undefined', () => {
      const formData = {
        target_band_score: null,
        test_date: '',
      };
      const setFormData = () => {};

      expect(() => {
        render(<GoalsSection formData={formData} setFormData={setFormData} />);
      }).not.toThrow();
    });
  });

  describe('DashboardHeader Greeting with Whitespace', () => {
    it('extracts proper firstName even with leading or repeated spaces', () => {
      const user = {
        full_name: '   Sam   Lee  ',
        username: 'samlee',
      };
      const stats = { avgScore: 7.0, measuredTests: 2, targetScore: 7.5 };
      const recommended = { title: 'Reading Diagnostic', href: '/reading-test' };

      render(
        <BrowserRouter>
          <DashboardHeader
            dateLabel="Monday, Nov 10"
            greeting="Hi"
            user={user}
            stats={stats}
            recommended={recommended}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('Hi, Sam')).toBeInTheDocument();
    });
  });
});
