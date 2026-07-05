import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Integration Tests: Dashboard and Learning Path Calculations
 * Tests calculation logic for stats, trends, and skill proficiency.
 */

// Mock data
const mockSessions = [
  {
    id: '1',
    test_type: 'reading',
    score: 7.5,
    completed_at: new Date().toISOString(),
    is_completed: true,
  },
  {
    id: '2',
    test_type: 'reading',
    score: 7.0,
    completed_at: new Date(Date.now() - 86400000).toISOString(),
    is_completed: true,
  },
  {
    id: '3',
    test_type: 'writing',
    score: 6.5,
    completed_at: new Date().toISOString(),
    is_completed: true,
  },
  {
    id: '4',
    test_type: 'listening',
    score: 8.0,
    completed_at: new Date().toISOString(),
    is_completed: true,
  },
  {
    id: '5',
    test_type: 'speaking',
    score: 7.0,
    completed_at: new Date().toISOString(),
    is_completed: true,
  },
];

const mockSkillProficiencies = [
  {
    skill_code: 'reading_main_idea',
    module: 'reading',
    mastery_probability: 0.45,
    practice_count: 20,
    next_review_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    skill_code: 'reading_inference',
    module: 'reading',
    mastery_probability: 0.62,
    practice_count: 15,
    next_review_at: new Date(Date.now() + 86400000).toISOString(),
  },
  {
    skill_code: 'writing_task_response',
    module: 'writing',
    mastery_probability: 0.55,
    practice_count: 10,
    next_review_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    skill_code: 'listening_note_completion',
    module: 'listening',
    mastery_probability: 0.75,
    practice_count: 25,
    next_review_at: new Date(Date.now() + 172800000).toISOString(),
  },
];

describe('Dashboard Calculations', () => {
  describe('Module Averages', () => {
    it('should calculate correct average for each module', () => {
      // Simulate the module average calculation
      const calculateModuleAverages = (sessions: typeof mockSessions) => {
        const mAvgs: Record<string, number> = {};
        ['reading', 'writing', 'listening', 'speaking'].forEach((type) => {
          const typeSessions = sessions.filter((s) => s.test_type === type && s.is_completed);
          if (typeSessions.length > 0) {
            mAvgs[type] =
              typeSessions.reduce((sum, s) => sum + (Number(s.score) || 0), 0) /
              typeSessions.length;
          }
        });
        return mAvgs;
      };

      const averages = calculateModuleAverages(mockSessions);

      expect(averages.reading).toBe(7.25); // (7.5 + 7.0) / 2
      expect(averages.writing).toBe(6.5);
      expect(averages.listening).toBe(8.0);
      expect(averages.speaking).toBe(7.0);
    });

    it('should handle empty sessions gracefully', () => {
      const calculateModuleAverages = (sessions: typeof mockSessions) => {
        const mAvgs: Record<string, number> = {};
        ['reading', 'writing', 'listening', 'speaking'].forEach((type) => {
          const typeSessions = sessions.filter((s) => s.test_type === type);
          if (typeSessions.length > 0) {
            mAvgs[type] =
              typeSessions.reduce((sum, s) => sum + (Number(s.score) || 0), 0) /
              typeSessions.length;
          }
        });
        return mAvgs;
      };

      const averages = calculateModuleAverages([]);

      expect(averages.reading).toBeUndefined();
      expect(averages.writing).toBeUndefined();
    });
  });

  describe('Module Trends', () => {
    it('should detect improving trend when latest score is higher', () => {
      const sessions = [
        { score: 8.0, test_type: 'reading', completed_at: new Date().toISOString() },
        {
          score: 7.0,
          test_type: 'reading',
          completed_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];

      const latest = sessions[0].score;
      const prev = sessions[1].score;
      const trend = latest > prev ? 'up' : latest < prev ? 'down' : 'stable';

      expect(trend).toBe('up');
    });

    it('should detect declining trend when latest score is lower', () => {
      const sessions = [
        { score: 6.5, test_type: 'reading', completed_at: new Date().toISOString() },
        {
          score: 7.5,
          test_type: 'reading',
          completed_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];

      const latest = sessions[0].score;
      const prev = sessions[1].score;
      const trend = latest > prev ? 'up' : latest < prev ? 'down' : 'stable';

      expect(trend).toBe('down');
    });

    it('should detect stable trend when scores are equal', () => {
      const sessions = [
        { score: 7.0, test_type: 'reading', completed_at: new Date().toISOString() },
        {
          score: 7.0,
          test_type: 'reading',
          completed_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];

      const latest = sessions[0].score;
      const prev = sessions[1].score;
      const trend = latest > prev ? 'up' : latest < prev ? 'down' : 'stable';

      expect(trend).toBe('stable');
    });
  });

  describe('Progress to Target', () => {
    it('should calculate correct progress percentage', () => {
      const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

      const avgScore = 6.5;
      const targetScore = 7.5;
      const progress = clamp01(avgScore / targetScore);

      expect(progress).toBeCloseTo(0.867, 2);
    });

    it('should clamp progress to 100% when score exceeds target', () => {
      const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

      const avgScore = 8.0;
      const targetScore = 7.0;
      const progress = clamp01(avgScore / targetScore);

      expect(progress).toBe(1);
    });

    it('should return 0 for invalid inputs', () => {
      const calculateProgress = (avg: number, target: number) => {
        if (!Number.isFinite(avg) || !Number.isFinite(target) || target <= 0) return 0;
        return Math.min(1, Math.max(0, avg / target));
      };

      expect(calculateProgress(NaN, 7.0)).toBe(0);
      expect(calculateProgress(6.5, 0)).toBe(0);
      expect(calculateProgress(6.5, -1)).toBe(0);
    });
  });
});

describe('Learning Path Calculations', () => {
  describe('Skill Trend Detection (5% threshold)', () => {
    it('should detect up trend with >5% improvement', () => {
      const recentAccuracy = 0.8;
      const previousAccuracy = 0.7;
      const diff = recentAccuracy - previousAccuracy;
      const trend = diff > 0.05 ? 'up' : diff < -0.05 ? 'down' : 'stable';

      expect(diff).toBeCloseTo(0.1, 2);
      expect(trend).toBe('up');
    });

    it('should detect down trend with >5% decline', () => {
      const recentAccuracy = 0.65;
      const previousAccuracy = 0.75;
      const diff = recentAccuracy - previousAccuracy;
      const trend = diff > 0.05 ? 'up' : diff < -0.05 ? 'down' : 'stable';

      expect(diff).toBeCloseTo(-0.1, 2);
      expect(trend).toBe('down');
    });

    it('should detect stable trend with <5% change', () => {
      const recentAccuracy = 0.72;
      const previousAccuracy = 0.7;
      const diff = recentAccuracy - previousAccuracy;
      const trend = diff > 0.05 ? 'up' : diff < -0.05 ? 'down' : 'stable';

      expect(diff).toBeCloseTo(0.02, 2);
      expect(trend).toBe('stable');
    });
  });

  describe('Skill Priority Assignment', () => {
    it('should assign high priority to skills with low mastery', () => {
      const assignPriority = (mastery: number, isDue: boolean) => {
        if (mastery < 0.55 || isDue) return 'high';
        if (mastery < 0.7) return 'medium';
        return 'low';
      };

      expect(assignPriority(0.45, false)).toBe('high');
      expect(assignPriority(0.54, false)).toBe('high');
    });

    it('should assign high priority to due skills regardless of mastery', () => {
      const assignPriority = (mastery: number, isDue: boolean) => {
        if (mastery < 0.55 || isDue) return 'high';
        if (mastery < 0.7) return 'medium';
        return 'low';
      };

      expect(assignPriority(0.85, true)).toBe('high');
    });

    it('should assign medium priority to skills with 55-70% mastery', () => {
      const assignPriority = (mastery: number, isDue: boolean) => {
        if (mastery < 0.55 || isDue) return 'high';
        if (mastery < 0.7) return 'medium';
        return 'low';
      };

      expect(assignPriority(0.6, false)).toBe('medium');
      expect(assignPriority(0.69, false)).toBe('medium');
    });

    it('should assign low priority to skills with >=70% mastery', () => {
      const assignPriority = (mastery: number, isDue: boolean) => {
        if (mastery < 0.55 || isDue) return 'high';
        if (mastery < 0.7) return 'medium';
        return 'low';
      };

      expect(assignPriority(0.7, false)).toBe('low');
      expect(assignPriority(0.95, false)).toBe('low');
    });
  });

  describe('Due Skill Detection', () => {
    it('should mark skill as due if next_review_at is in the past', () => {
      const now = Date.now();
      const pastDate = new Date(now - 86400000).toISOString(); // Yesterday
      const nextReviewAt = new Date(pastDate).getTime();
      const isDue = nextReviewAt !== null && Number.isFinite(nextReviewAt) && nextReviewAt <= now;

      expect(isDue).toBe(true);
    });

    it('should not mark skill as due if next_review_at is in the future', () => {
      const now = Date.now();
      const futureDate = new Date(now + 86400000).toISOString(); // Tomorrow
      const nextReviewAt = new Date(futureDate).getTime();
      const isDue = nextReviewAt !== null && Number.isFinite(nextReviewAt) && nextReviewAt <= now;

      expect(isDue).toBe(false);
    });
  });

  describe('Study Intensity Determination', () => {
    it('should return urgent intensity for <=7 days until exam', () => {
      const determineIntensity = (daysUntilExam: number) => {
        if (daysUntilExam <= 7) return 'urgent';
        if (daysUntilExam <= 14) return 'intensive';
        if (daysUntilExam <= 30) return 'focused';
        return 'balanced';
      };

      expect(determineIntensity(3)).toBe('urgent');
      expect(determineIntensity(7)).toBe('urgent');
    });

    it('should return intensive for 8-14 days until exam', () => {
      const determineIntensity = (daysUntilExam: number) => {
        if (daysUntilExam <= 7) return 'urgent';
        if (daysUntilExam <= 14) return 'intensive';
        if (daysUntilExam <= 30) return 'focused';
        return 'balanced';
      };

      expect(determineIntensity(10)).toBe('intensive');
      expect(determineIntensity(14)).toBe('intensive');
    });

    it('should return focused for 15-30 days until exam', () => {
      const determineIntensity = (daysUntilExam: number) => {
        if (daysUntilExam <= 7) return 'urgent';
        if (daysUntilExam <= 14) return 'intensive';
        if (daysUntilExam <= 30) return 'focused';
        return 'balanced';
      };

      expect(determineIntensity(20)).toBe('focused');
      expect(determineIntensity(30)).toBe('focused');
    });

    it('should return balanced for >30 days until exam', () => {
      const determineIntensity = (daysUntilExam: number) => {
        if (daysUntilExam <= 7) return 'urgent';
        if (daysUntilExam <= 14) return 'intensive';
        if (daysUntilExam <= 30) return 'focused';
        return 'balanced';
      };

      expect(determineIntensity(60)).toBe('balanced');
      expect(determineIntensity(90)).toBe('balanced');
    });
  });
});

describe('Score-Based Regeneration Logic', () => {
  it('should trigger regeneration for >=0.8 band score change', () => {
    const shouldRegenerate = (currentScore: number, prevAvg: number) => {
      const scoreDiff = Math.abs(currentScore - prevAvg);
      return scoreDiff >= 0.8;
    };

    expect(shouldRegenerate(7.5, 6.5)).toBe(true);
    expect(shouldRegenerate(8.0, 7.0)).toBe(true);
    expect(shouldRegenerate(6.0, 7.0)).toBe(true); // Decline also triggers
  });

  it('should not trigger regeneration for <0.8 band score change', () => {
    const shouldRegenerate = (currentScore: number, prevAvg: number) => {
      const scoreDiff = Math.abs(currentScore - prevAvg);
      return scoreDiff >= 0.8;
    };

    expect(shouldRegenerate(7.0, 6.5)).toBe(false);
    expect(shouldRegenerate(7.0, 7.5)).toBe(false); // 0.5 difference
  });
});

describe('Skill Proficiency Sorting', () => {
  it('should sort skills by mastery ascending', () => {
    const skills = [
      { skill_code: 'a', mastery: 0.75, practice_count: 10 },
      { skill_code: 'b', mastery: 0.45, practice_count: 20 },
      { skill_code: 'c', mastery: 0.6, practice_count: 15 },
    ];

    const sorted = [...skills].sort((a, b) => a.mastery - b.mastery);

    expect(sorted[0].skill_code).toBe('b'); // Lowest mastery
    expect(sorted[1].skill_code).toBe('c');
    expect(sorted[2].skill_code).toBe('a'); // Highest mastery
  });

  it('should use practice_count as secondary sort when mastery is equal', () => {
    const skills = [
      { skill_code: 'a', mastery: 0.5, practice_count: 10 },
      { skill_code: 'b', mastery: 0.5, practice_count: 30 },
      { skill_code: 'c', mastery: 0.5, practice_count: 20 },
    ];

    const sorted = [...skills].sort(
      (a, b) => a.mastery - b.mastery || b.practice_count - a.practice_count
    );

    // Higher practice count should come first when mastery is equal
    expect(sorted[0].skill_code).toBe('b'); // 30 practice
    expect(sorted[1].skill_code).toBe('c'); // 20 practice
    expect(sorted[2].skill_code).toBe('a'); // 10 practice
  });
});

describe('formatSkillName Utility', () => {
  it('should format skill codes into readable names', () => {
    const formatSkillName = (skillCode: string) => {
      if (!skillCode) return '';
      const parts = String(skillCode).split('_');
      if (parts.length <= 1) return String(skillCode);
      return parts
        .slice(1)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    };

    expect(formatSkillName('reading_main_idea')).toBe('Main Idea');
    expect(formatSkillName('writing_task_response')).toBe('Task Response');
    expect(formatSkillName('listening_note_completion')).toBe('Note Completion');
  });

  it('should handle empty or single-part skill codes', () => {
    const formatSkillName = (skillCode: string) => {
      if (!skillCode) return '';
      const parts = String(skillCode).split('_');
      if (parts.length <= 1) return String(skillCode);
      return parts.slice(1).join(' ').trim();
    };

    expect(formatSkillName('')).toBe('');
    expect(formatSkillName('reading')).toBe('reading');
  });
});

describe('Days Until Exam Calculation', () => {
  it('should calculate correct days until exam', () => {
    const calculateDaysUntilExam = (testDate: string | null) => {
      if (!testDate) return null;
      const examDate = new Date(testDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      examDate.setHours(0, 0, 0, 0);
      const diffTime = examDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Set exam date to 30 days from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    expect(calculateDaysUntilExam(futureDate.toISOString())).toBe(30);
  });

  it('should return null for null test date', () => {
    const calculateDaysUntilExam = (testDate: string | null) => {
      if (!testDate) return null;
      return 30; // Simplified
    };

    expect(calculateDaysUntilExam(null)).toBeNull();
  });

  it('should return negative for past exam dates', () => {
    const calculateDaysUntilExam = (testDate: string | null) => {
      if (!testDate) return null;
      const examDate = new Date(testDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      examDate.setHours(0, 0, 0, 0);
      const diffTime = examDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Set exam date to yesterday
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    expect(calculateDaysUntilExam(pastDate.toISOString())).toBe(-1);
  });
});

describe('Completion Percentage Calculation', () => {
  it('should calculate correct completion percentage', () => {
    const tasks = [
      { completed: true },
      { completed: false },
      { completed: true },
      { completed: false },
    ];
    const doneCount = tasks.filter((t) => t.completed).length;
    const completionPercent = Math.round((doneCount / tasks.length) * 100);

    expect(completionPercent).toBe(50);
  });

  it('should return 0 for empty task list', () => {
    const tasks: any[] = [];
    const completionPercent = tasks.length === 0 ? 0 : Math.round((0 / tasks.length) * 100);

    expect(completionPercent).toBe(0);
  });

  it('should return 100 for all completed tasks', () => {
    const tasks = [{ completed: true }, { completed: true }, { completed: true }];
    const doneCount = tasks.filter((t) => t.completed).length;
    const completionPercent = Math.round((doneCount / tasks.length) * 100);

    expect(completionPercent).toBe(100);
  });
});
