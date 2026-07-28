import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpenText,
  CheckCircle2,
  Clock3,
  FilePenLine,
  Lightbulb,
  Mic2,
  Route,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { skillLabel, skillMeta } from '../constants';

function headingId(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function renderInline(value, keyPrefix) {
  return String(value || '')
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, index) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={`${keyPrefix}-strong-${index}`} className="font-extrabold text-slate-950">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={`${keyPrefix}-text-${index}`}>{part}</span>
      )
    );
}

function parseGrammarGuide(content) {
  const sections = [];
  let current = {
    id: 'start',
    title: '',
    blocks: [],
  };

  String(content || '')
    .split('\n')
    .forEach((line) => {
      const value = line.trim();
      if (!value) return;

      if (value.startsWith('## ')) {
        if (current.title || current.blocks.length) sections.push(current);
        const title = value.slice(3).trim();
        current = { id: headingId(title), title, blocks: [] };
        return;
      }
      if (value.startsWith('### ')) {
        current.blocks.push({ type: 'subheading', value: value.slice(4).trim() });
        return;
      }
      if (value.startsWith('- ')) {
        current.blocks.push({ type: 'bullet', value: value.slice(2).trim() });
        return;
      }
      if (/^\d+\.\s/.test(value)) {
        current.blocks.push({ type: 'numbered', value: value.replace(/^\d+\.\s/, '') });
        return;
      }
      if (value.startsWith('> ')) {
        current.blocks.push({ type: 'example', value: value.slice(2).trim() });
        return;
      }
      current.blocks.push({ type: 'paragraph', value });
    });

  if (current.title || current.blocks.length) sections.push(current);
  return sections;
}

function GuideBlock({ block, index }) {
  const content = renderInline(block.value, `${block.type}-${index}`);
  if (block.type === 'subheading') {
    return (
      <h3 className="mt-6 text-base font-extrabold tracking-tight text-slate-950">{content}</h3>
    );
  }
  if (block.type === 'bullet') {
    return (
      <li className="flex gap-3 text-sm font-medium leading-7 text-slate-600">
        <CheckCircle2 className="mt-1.5 h-4 w-4 shrink-0 text-emerald-500" />
        <span>{content}</span>
      </li>
    );
  }
  if (block.type === 'numbered') {
    return (
      <li className="ml-5 list-decimal pl-1 text-sm font-medium leading-7 text-slate-600 marker:font-extrabold marker:text-[#5963e8]">
        {content}
      </li>
    );
  }
  if (block.type === 'example') {
    return (
      <blockquote className="my-4 rounded-2xl border border-[#dfe3fb] bg-[#f5f6ff] px-5 py-4 text-[15px] font-bold leading-7 text-slate-800 shadow-[inset_4px_0_0_#6972e8]">
        {content}
      </blockquote>
    );
  }
  return <p className="text-sm font-medium leading-7 text-slate-600">{content}</p>;
}

function GuideSection({ section }) {
  return (
    <section id={section.id} className="scroll-mt-24 border-b border-[#eceefa] pb-8 last:border-0">
      {section.title && (
        <div className="mb-4 flex items-start gap-3">
          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eef0ff] text-[#5661e9]">
            <Lightbulb className="h-4 w-4" />
          </div>
          <h2 className="text-xl font-black tracking-[-0.025em] text-slate-950">{section.title}</h2>
        </div>
      )}
      <div className="space-y-3">
        {section.blocks.map((block, index) => (
          <GuideBlock key={`${section.id}-${block.type}-${index}`} block={block} index={index} />
        ))}
      </div>
    </section>
  );
}

export default function GrammarGuidePage({ resource, isStarting, onBack, onPractice }) {
  if (!resource) {
    return (
      <section className="mx-auto max-w-3xl rounded-3xl border border-[#e3e6f4] bg-white p-8 text-center">
        <BookOpenText className="mx-auto h-8 w-8 text-[#6872e8]" />
        <h1 className="mt-3 text-xl font-black text-slate-950">Guide not found</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          This Grammar Lab guide is not available.
        </p>
        <Button onClick={onBack} variant="outline" className="mt-5 rounded-xl font-extrabold">
          Back to Grammar Lab
        </Button>
      </section>
    );
  }

  const sections = parseGrammarGuide(resource.content_markdown);
  const meta = skillMeta(resource.skill_code);

  return (
    <div className="mx-auto max-w-[1280px]">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-extrabold text-slate-500 transition hover:bg-white hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" /> Grammar Lab
      </button>

      <section className="relative overflow-hidden rounded-3xl border border-[#dfe3f3] bg-white px-6 py-7 shadow-[0_24px_70px_-50px_rgba(48,58,128,0.7)] sm:px-8 sm:py-9">
        <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-[radial-gradient(circle_at_70%_40%,rgba(126,135,255,0.18),transparent_55%)] lg:block" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#dfe3ff] bg-[#f2f3ff] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#5059d8]">
            <BookOpenText className="h-3.5 w-3.5" />
            {skillLabel(resource.skill_code)}
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] text-slate-950 sm:text-4xl">
            {resource.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-600">
            {resource.summary}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f7f8fc] px-3 py-1.5">
              <Clock3 className="h-3.5 w-3.5 text-[#6872e8]" />
              {resource.estimated_minutes} minute guide
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              IELTS Writing & Speaking
            </span>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <article className="space-y-8 rounded-3xl border border-[#e3e6f4] bg-white px-5 py-7 shadow-[0_18px_55px_-44px_rgba(48,58,128,0.7)] sm:px-8 sm:py-9">
          {sections.map((section) => (
            <GuideSection key={section.id} section={section} />
          ))}
        </article>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <nav
            aria-label="Guide contents"
            className="rounded-3xl border border-[#e3e6f4] bg-white p-5 shadow-[0_18px_55px_-44px_rgba(48,58,128,0.7)]"
          >
            <div className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#5963d9]">
              In this guide
            </div>
            <div className="mt-3 space-y-1">
              {sections
                .filter((section) => section.title)
                .map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-[#f3f4ff] hover:text-[#505bdd]"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eef0ff] text-[10px] text-[#5963d9]">
                      {index + 1}
                    </span>
                    {section.title}
                  </a>
                ))}
            </div>
          </nav>

          <section className="rounded-3xl border border-[#dfe3fa] bg-[linear-gradient(145deg,#f7f7ff,#eef1ff)] p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#5661e9] shadow-sm">
              <Route className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-base font-black text-slate-950">Your next step</h2>
            <p className="mt-2 text-xs font-medium leading-5 text-slate-600">
              {meta.guideOutcome || meta.transferHint}
            </p>
            <Button
              onClick={() => onPractice(resource.skill_code)}
              disabled={isStarting}
              className="mt-4 w-full rounded-xl bg-[#5661e9] font-extrabold text-white hover:bg-[#4853d6]"
            >
              Practise this skill <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </section>

          <section className="rounded-3xl border border-[#e3e6f4] bg-white p-5">
            <h2 className="text-sm font-black text-slate-950">Apply it in IELTS</h2>
            <div className="mt-3 space-y-2">
              {[
                { to: '/writing', label: 'Writing practice', icon: FilePenLine },
                { to: '/speaking', label: 'Speaking practice', icon: Mic2 },
                { to: '/learning-path', label: 'AI Learning Path', icon: Sparkles },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center justify-between rounded-xl border border-[#eceefa] px-3 py-2.5',
                    'text-xs font-extrabold text-slate-700 transition hover:border-[#cfd4fa] hover:text-[#505bdd]'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-[#6872e8]" />
                    {item.label}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </section>

          <div className="hidden items-center gap-2 px-2 text-[11px] font-bold text-slate-400 lg:flex">
            <BarChart3 className="h-3.5 w-3.5" />
            Practice evidence stays separate from IELTS band scores.
          </div>
        </aside>
      </div>
    </div>
  );
}
