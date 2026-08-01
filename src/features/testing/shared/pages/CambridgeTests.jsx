import React, { useState, memo, useMemo } from 'react';
import { m, motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import {
  Search,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  GraduationCap,
  ChevronRight,
  Award,
  Sparkles,
  ShieldCheck,
  LayoutGrid,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { User } from '@/features/auth/services/User';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useDataQuery } from '@/hooks/useDataQuery';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Bar,
  Empty,
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  Pill,
  TILE,
  TITLE,
  WELL,
} from '@/features/dashboard/components/primitives';

// One calm tone across the four modules: the icon glyph already tells them
// apart, and colour on these cards is reserved for progress state.
const MODULE_META = {
  reading: { label: 'Reading', icon: BookOpen, tone: 'neutral', url: '/reading-test' },
  listening: { label: 'Listening', icon: Headphones, tone: 'neutral', url: '/listening-test' },
  writing: { label: 'Writing', icon: PenTool, tone: 'neutral', url: '/writing-task?taskId=' },
  speaking: { label: 'Speaking', icon: Mic, tone: 'neutral', url: '/speaking-test' },
};

const MODULE_TYPES = ['reading', 'listening', 'writing', 'speaking'];

const InactiveModuleLink = ({ type }) => {
  const meta = MODULE_META[type];
  return (
    <div className={cn(TILE, 'flex h-10 items-center gap-2 px-2.5 opacity-40 sm:h-11')}>
      <IconChip icon={meta.icon} tone="neutral" size="sm" />
      <div className="flex min-w-0 flex-col">
        <span className={cn(MICRO, 'truncate leading-none text-slate-400')}>{meta.label}</span>
        <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider leading-tight text-slate-400/70">
          N/A
        </span>
      </div>
    </div>
  );
};

const ActiveModuleLink = ({ type, data, session }) => {
  const meta = MODULE_META[type];
  const isResuming = !!session;
  const href = type === 'writing' ? `${meta.url}${data.id}` : `${meta.url}/${data.id}`;

  return (
    <Link to={href} className="group/module block h-10 sm:h-11">
      <div
        className={cn(
          TILE,
          'flex h-full items-center gap-2 px-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:hover:border-white/[0.12]'
        )}
      >
        <IconChip icon={meta.icon} tone={meta.tone} size="sm" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className={cn(MICRO, 'truncate leading-none text-slate-700 dark:text-slate-200')}>
            {meta.label}
          </span>
          <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider leading-tight text-slate-400 dark:text-slate-500">
            {isResuming ? 'Resume' : 'Start'}
          </span>
        </div>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform group-hover/module:translate-x-0.5 dark:text-slate-600" />
      </div>
    </Link>
  );
};

const ModuleLink = ({ type, data, session }) => {
  if (!data) return <InactiveModuleLink type={type} />;
  return <ActiveModuleLink type={type} data={data} session={session} />;
};

const isModuleCompletedWithScore = (module, session) => {
  return !!(module && session?.is_completed && session?.score != null);
};

const TestCardHeader = ({ progressPercent }) => (
  <div className="mb-3 flex items-start justify-between">
    <IconChip icon={GraduationCap} tone="accent" size="md" />
    {progressPercent > 0 ? (
      <Pill tone={progressPercent === 100 ? 'ok' : 'accent'}>
        <span className={NUM}>{progressPercent}%</span> done
      </Pill>
    ) : (
      <Pill tone="neutral">
        <ShieldCheck className="h-3 w-3" /> Official
      </Pill>
    )}
  </div>
);

const TestCardBandScore = ({ overallBandScore, completedScoresLength, moduleScores }) => (
  <div className={cn(WELL, 'flex items-center justify-between gap-3 rounded-lg p-2')}>
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg border border-[#e4e2f0] bg-white dark:border-white/10 dark:bg-white/[0.06]'
        )}
      >
        <span className={cn(NUM, 'text-sm font-extrabold text-slate-900 dark:text-white')}>
          {overallBandScore}
        </span>
      </div>
      <div className="flex flex-col">
        <span className={cn(MICRO, MUTED, 'leading-none')}>Overall</span>
        <span
          className={cn(NUM, 'mt-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300')}
        >
          {completedScoresLength}/4
        </span>
      </div>
    </div>
    <div className="flex items-center gap-1">
      {MODULE_TYPES.map((type) => {
        const score = moduleScores[type];
        return (
          <div
            key={type}
            className={cn(
              'flex min-w-[26px] flex-col items-center rounded-md px-1.5 py-1',
              score != null
                ? 'border border-[#e4e2f0] bg-white dark:border-white/10 dark:bg-white/[0.06]'
                : 'opacity-30'
            )}
          >
            <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400">
              {MODULE_META[type].label[0]}
            </span>
            <span
              className={cn(
                NUM,
                'text-[10px] font-bold',
                score != null
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-300 dark:text-slate-700'
              )}
            >
              {score != null ? score.toFixed(1) : '—'}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

const TestCardProgressBar = ({ progressPercent }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <span className={cn(MICRO, MUTED)}>Completion</span>
      <span className={cn(NUM, 'text-xs font-bold text-[#5a63df] dark:text-[#a9afff]')}>
        {progressPercent}%
      </span>
    </div>
    <Bar value={progressPercent} />
  </div>
);

const calculateCardStats = (title, modules, sessions) => {
  const totalInGroup = MODULE_TYPES.filter((k) => modules[k]).length;
  const completedInGroup = MODULE_TYPES.filter(
    (k) => modules[k] && sessions[modules[k].id]?.is_completed
  ).length;

  const progressPercent =
    totalInGroup > 0 ? Math.round((completedInGroup / totalInGroup) * 100) : 0;

  const moduleScores = MODULE_TYPES.reduce((acc, type) => {
    const module = modules[type];
    const session = module ? sessions[module.id] : null;
    if (isModuleCompletedWithScore(module, session)) {
      acc[type] = parseFloat(session.score);
    }
    return acc;
  }, {});

  const completedScores = Object.values(moduleScores);
  const hasScores = completedScores.length > 0;
  const overallBandScore = hasScores
    ? (completedScores.reduce((sum, s) => sum + s, 0) / completedScores.length).toFixed(1)
    : null;

  return {
    progressPercent,
    moduleScores,
    hasScores,
    completedScoresLength: completedScores.length,
    overallBandScore,
  };
};

const CambridgeTestCard = ({ title, modules, sessions }) => {
  const { progressPercent, moduleScores, hasScores, completedScoresLength, overallBandScore } =
    useMemo(() => calculateCardStats(title, modules, sessions), [title, modules, sessions]);

  return (
    <div
      className={cn(
        PANEL,
        'flex h-full flex-col p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:hover:border-white/[0.12]'
      )}
    >
      <TestCardHeader progressPercent={progressPercent} />

      <div className="mb-3 flex-grow">
        <h3 className={cn(TITLE, 'text-sm leading-snug')}>{title}</h3>
        <p className={cn(MICRO, MUTED, 'mt-1 line-clamp-1')}>
          Full IELTS exam simulation, all four skills.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {MODULE_TYPES.map((type) => (
            <ModuleLink
              key={type}
              type={type}
              data={modules[type]}
              session={modules[type] && sessions[modules[type].id]}
            />
          ))}
        </div>
      </div>

      {hasScores ? (
        <TestCardBandScore
          overallBandScore={overallBandScore}
          completedScoresLength={completedScoresLength}
          moduleScores={moduleScores}
        />
      ) : progressPercent > 0 && progressPercent < 100 ? (
        <TestCardProgressBar progressPercent={progressPercent} />
      ) : null}
    </div>
  );
};

const MemoizedCambridgeTestCard = memo(CambridgeTestCard);

const mapUserSessions = (sessionData) => {
  const userSessions = {};
  sessionData.forEach((s) => {
    const pId = s.passage_id;
    if (pId) userSessions[pId] = s;
  });
  return userSessions;
};

const getGroupTypeSuffix = (title) => {
  const titleLower = (title || '').toLowerCase();
  return titleLower.includes('general training') || titleLower.includes(' gt ') ? ' GT' : '';
};

const getGroupTitle = (p, year, testNum) => {
  if (year && testNum) {
    const bookNumber = year - 2005;
    const type = getGroupTypeSuffix(p.title);
    return `IELTS ${bookNumber}${type} • Test ${testNum} (${year})`;
  }
  return (
    p.title.replace(/\s+(Reading|Listening|Writing|Speaking|Task\s+\d+).*$/i, '').trim() ||
    'Uncategorized'
  );
};

const buildCambridgeTestGroups = (passages) => {
  const groups = {};
  passages.forEach((p) => {
    const year = p.cambridge_year || 0;
    const testNum = p.cambridge_test_number || 0;
    const groupKey = `${year}-${testNum}`;
    const groupTitle = getGroupTitle(p, year, testNum);

    if (!groups[groupKey]) {
      groups[groupKey] = {
        title: groupTitle,
        year,
        testNumber: testNum,
        modules: { reading: null, listening: null, writing: null, speaking: null },
      };
    }

    const typeKey = (p.test_type || '').toLowerCase();
    if (groups[groupKey].modules[typeKey] !== undefined) {
      groups[groupKey].modules[typeKey] = p;
    }
  });

  return Object.values(groups).sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.testNumber - a.testNumber;
  });
};

const fetchCambridgeTestData = async () => {
  let userData = null;
  try {
    userData = await User.me();
  } catch (e) {
    console.warn('Authentication error or no user:', e.message);
  }

  const [passagesResult, sessionsResult] = await Promise.all([
    supabase
      .from('passages')
      .select(
        'id, title, test_type, cambridge_year, cambridge_test_number, is_official_cambridge, is_active'
      )
      .eq('is_active', true)
      .or('is_official_cambridge.eq.true,title.ilike.%cambridge%,cambridge_year.gt.0')
      .order('cambridge_year', { ascending: false }),
    userData
      ? supabase
          .from('test_sessions')
          .select('id, passage_id, is_completed, score')
          .eq('user_id', userData.id)
      : Promise.resolve({ data: [] }),
  ]);

  if (passagesResult.error) throw passagesResult.error;

  const passages = passagesResult.data || [];
  const sessionData = sessionsResult?.data || [];

  return {
    groupedTests: buildCambridgeTestGroups(passages),
    sessions: mapUserSessions(sessionData),
    user: userData,
  };
};

const CambridgeTestsControls = ({ searchQuery, setSearchQuery, activeTab, setActiveTab, tabs }) => (
  <div
    className={cn(
      TILE,
      'flex flex-col gap-2.5 p-2.5 lg:flex-row lg:items-center lg:justify-between'
    )}
  >
    <div className="group relative w-full lg:max-w-xs">
      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#5a63df]" />
      <Input
        placeholder="Find a series or book..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="h-9 rounded-lg border-[#e2e5f2] bg-white pl-9 text-xs font-semibold dark:border-white/10 dark:bg-[#131218]"
      />
    </div>

    <div className="no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto rounded-lg border border-[#e2e5f2] bg-white p-0.5 dark:border-white/10 dark:bg-white/[0.04] lg:flex-none">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <m.button
            key={tab.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative z-10 flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider transition-colors duration-200',
              isActive
                ? 'text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white'
            )}
          >
            {isActive && (
              <m.div
                layoutId="cambridgeTabIndicator"
                className="absolute inset-0 -z-10 rounded-md bg-[#5a63df]"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            {tab.label}
          </m.button>
        );
      })}
    </div>
  </div>
);

const CambridgeTestsHeader = ({ searchQuery, setSearchQuery, activeTab, setActiveTab, tabs }) => (
  <header className="mb-1 flex flex-col gap-3 border-b border-[#eeedf7] pb-4 dark:border-white/[0.07]">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-2xl">
        <Pill tone="accent">
          <Sparkles className="h-3 w-3" />
          Standard mastery kits
        </Pill>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Cambridge Series
        </h1>
        <p className={cn('mt-1 text-sm font-medium', MUTED)}>
          Precision-curated full exam kits from official Cambridge IELTS books 10 through 20.
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <Pill tone="sky">Official Cambridge content</Pill>
          <Pill tone="emerald">Full exam simulation</Pill>
        </div>
      </div>
    </div>

    <CambridgeTestsControls
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabs={tabs}
    />
  </header>
);

const CambridgeCardSkeleton = () => (
  <div className={cn(PANEL, 'flex h-[300px] flex-col p-4')}>
    <div className="mb-3 flex items-start justify-between">
      <Skeleton className="h-7 w-7 rounded-md" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
    <Skeleton className="mb-1.5 h-4 w-3/4 rounded-md" />
    <Skeleton className="mb-3 h-3 w-2/3 rounded-md" />
    <div className="grid flex-grow grid-cols-2 gap-2 content-start">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-10 rounded-lg sm:h-11" />
      ))}
    </div>
    <Skeleton className="mt-3 h-10 w-full rounded-lg" />
  </div>
);

const CambridgeTestsGrid = ({ loading, filteredGroups, sessions }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <CambridgeCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (filteredGroups.length === 0) {
    return (
      <div className={cn(PANEL, 'p-4 sm:p-5')}>
        <Empty icon={BookOpen}>
          <span className={cn(TITLE, 'block text-sm')}>No kits found</span>
          <span className="mt-1 block">Try searching for a different year or book series.</span>
        </Empty>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filteredGroups.map((group, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.25 }}
        >
          <MemoizedCambridgeTestCard
            title={group.title}
            modules={group.modules}
            sessions={sessions}
          />
        </motion.div>
      ))}
    </div>
  );
};

const filterGroupedTests = (groupedTests, activeTab, debouncedSearch) => {
  return groupedTests.filter((group) => {
    const matchesYear = activeTab === 'all' || group.year.toString() === activeTab;
    const matchesSearch = group.title.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchesYear && matchesSearch;
  });
};

const getUniqueYears = (groupedTests) => {
  return [...new Set(groupedTests.map((g) => g.year).filter((y) => y))].sort((a, b) => b - a);
};

const buildTabs = (uniqueYears) => {
  return [
    { id: 'all', label: 'All Series', icon: LayoutGrid },
    ...uniqueYears.map((year) => ({ id: year.toString(), label: year.toString(), icon: Award })),
  ];
};

export default function CambridgeTests() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { userProfile: userData } = useAuth();
  const { data: cambridgeData, loading: isLoading } = useDataQuery(
    `cambridge-tests-data-${userData?.id || 'anon'}`,
    fetchCambridgeTestData
  );

  const groupedTests = useMemo(
    () => cambridgeData?.groupedTests || [],
    [cambridgeData?.groupedTests]
  );
  const sessions = cambridgeData?.sessions || {};
  const loading = isLoading;

  const uniqueYears = useMemo(() => getUniqueYears(groupedTests), [groupedTests]);
  const tabs = useMemo(() => buildTabs(uniqueYears), [uniqueYears]);
  const filteredGroups = useMemo(
    () => filterGroupedTests(groupedTests, activeTab, debouncedSearch),
    [groupedTests, activeTab, debouncedSearch]
  );

  return (
    <main className="relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-4 pt-16 text-slate-950 dark:bg-[#0b0a10] dark:text-white sm:px-4 sm:pt-4 md:px-5 md:py-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-[size:20px_20px] opacity-[0.10] dark:opacity-[0.14]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 -z-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.55),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.16),transparent_70%)]"
      />

      <div className="relative z-10 mx-auto max-w-[1600px] space-y-4">
        <CambridgeTestsHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={tabs}
        />

        <CambridgeTestsGrid loading={loading} filteredGroups={filteredGroups} sessions={sessions} />
      </div>
    </main>
  );
}
