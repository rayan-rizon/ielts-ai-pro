import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { m } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Eye,
  Facebook,
  GraduationCap,
  Headphones,
  Linkedin,
  List,
  Mic2,
  PenLine,
  Share2,
  Sparkles,
  Tag,
  UserRound,
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import DocumentHead from '@/components/shared/DocumentHead';
import Footer from '@/features/core/components/landing/Footer';
import PublicNavbar from '@/features/core/components/landing/PublicNavbar';
import {
  BLOG_COVER_HEIGHT,
  BLOG_COVER_WIDTH,
  getBlogCoverAlt,
} from '@/features/learning/utils/blogCoverMeta';
import { supabase } from '@/lib/supabase';
import { SidebarPracticeCard } from '@/features/learning/components/SidebarPracticeCard';
import { getBlogSeoMeta } from '@/features/learning/utils/blogSeo';

const PRACTICE_LINKS = {
  Writing: '/ielts-writing-checker',
  Speaking: '/ielts-speaking-practice-ai',
  Reading: '/cambridge-ielts-practice-tests#reading',
  Listening: '/cambridge-ielts-practice-tests#listening',
  'Study Planning': '/cambridge-ielts-practice-tests',
  'Exam Updates': '/cambridge-ielts-practice-tests',
  'Mock Tests': '/cambridge-ielts-practice-tests',
};

const PRACTICE_LABELS = {
  'Study Planning': 'Start a mock test',
  'Exam Updates': 'Start a mock test',
  'Mock Tests': 'Start a mock test',
};

function absoluteImageUrl(path) {
  if (!path) return 'https://www.ieltsai.pro/ielts-hero-student.webp';
  try {
    return new URL(path, 'https://www.ieltsai.pro').toString();
  } catch {
    return 'https://www.ieltsai.pro/ielts-hero-student.webp';
  }
}

function getExcerpt(htmlContent) {
  if (!htmlContent) return '';
  const plainText = DOMPurify.sanitize(htmlContent, { ALLOWED_TAGS: [] });
  return `${plainText.substring(0, 160).trim()}${plainText.length > 160 ? '...' : ''}`;
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

function formatReadCount(value) {
  const count = Math.max(0, Number(value) || 0);
  return `${new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(
    count
  )} ${count === 1 ? 'read' : 'reads'}`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function prepareArticleContent(content) {
  const cleanHtml = DOMPurify.sanitize(content || '', {
    FORBID_ATTR: ['style'],
  });
  if (typeof DOMParser === 'undefined') return { html: cleanHtml, toc: [] };

  const documentNode = new DOMParser().parseFromString(cleanHtml, 'text/html');
  const seenIds = new Map();
  const toc = [];
  documentNode.querySelectorAll('h2, h3').forEach((heading) => {
    const baseId = slugify(heading.textContent || '') || 'section';
    const count = seenIds.get(baseId) || 0;
    const id = count ? `${baseId}-${count + 1}` : baseId;
    seenIds.set(baseId, count + 1);
    heading.id = id;
    toc.push({ id, text: heading.textContent, level: heading.tagName === 'H3' ? 3 : 2 });
  });
  return { html: documentNode.body.innerHTML, toc };
}

function RelatedCard({ article }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-[#e4e2f0] dark:border-white/[0.07] bg-linear-to-b/srgb from-white to-[#faf9ff] dark:from-[#141319] dark:to-[#100f15] transition-all duration-200 hover:-translate-y-1 hover:border-[#5a63df]/30">
      <Link to={`/blog/${article.slug}`}>
        <div className="relative h-32 overflow-hidden bg-slate-100 dark:bg-white/3">
          <img
            src={article.thumbnail_url || '/ielts-hero-student.webp'}
            alt={getBlogCoverAlt(article)}
            width={BLOG_COVER_WIDTH}
            height={BLOG_COVER_HEIGHT}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute left-2.5 top-2.5 rounded-md border border-[#5a63df]/30 bg-white/90 dark:bg-[#141319]/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#5a63df] dark:text-[#a9afff] shadow-xs">
            {article.category || 'IELTS Guide'}
          </span>
        </div>
        <div className="p-3.5">
          <h3 className="line-clamp-2 text-xs font-extrabold leading-snug tracking-tight text-slate-800 dark:text-slate-100 group-hover:text-[#5a63df] dark:group-hover:text-[#8f97ff]">
            {article.title}
          </h3>
          <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-[#5a63df] dark:text-[#a9afff]">
            Read guide <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </Link>
    </article>
  );
}

function BlogPostLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#f7f9ff] dark:bg-[#090b13]">
      <PublicNavbar />
      <div className="mx-auto grid max-w-7xl gap-8 px-5 pb-14 pt-28 sm:px-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-16 w-4/5" />
        </div>
        <Skeleton className="aspect-video rounded-2xl" />
      </div>
    </div>
  );
}

function BlogPostHero({ post, publishedDate }) {
  return (
    <section className="relative overflow-hidden border-b border-[#e4e2f0] dark:border-white/[0.07] bg-linear-to-b/srgb from-white via-[#faf9ff] to-white dark:from-[#090b13] dark:via-[#0e111c] dark:to-[#090b13]">
      <div className="relative mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:py-12">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
        >
          <Link
            to="/blog"
            className="text-slate-600 hover:text-[#5a63df] dark:text-slate-300 dark:hover:text-[#a9afff]"
          >
            Blog library
          </Link>
          <span className="text-slate-400 dark:text-slate-500">/</span>
          <span className="text-slate-700 dark:text-slate-200">{post.category || 'Guide'}</span>
          <span className="text-slate-400 dark:text-slate-500">/</span>
          <span className="max-w-[280px] sm:max-w-md truncate text-slate-900 dark:text-slate-100 font-bold">
            {post.title}
          </span>
        </nav>

        <div className="grid items-center gap-8 lg:grid-cols-[.95fr_1.05fr]">
          <m.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#5a63df]/30 bg-[#5a63df]/15 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#5a63df] dark:border-[#8f97ff]/40 dark:bg-[#8f97ff]/20 dark:text-[#a9afff]">
              <PenLineIcon category={post.category} /> {post.category || 'IELTS Guide'}
            </span>
            <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-[3.1rem] text-slate-900 dark:text-white">
              {post.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
              {post.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono tabular-nums tracking-tight text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-2 font-sans font-semibold text-slate-700 dark:text-slate-200">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#5a63df]/25 bg-[#5a63df]/10 text-[#5a63df] dark:border-[#8f97ff]/30 dark:bg-[#8f97ff]/15 dark:text-[#a9afff]">
                  <UserRound className="h-3.5 w-3.5" />
                </span>
                IELTS Ai Pro team
              </span>
              <span className="hidden h-4 w-px bg-slate-200 sm:block dark:bg-white/10" />
              <span className="inline-flex items-center gap-1.5 font-sans">
                <CalendarDays className="h-3.5 w-3.5 text-slate-400" /> {formatDate(publishedDate)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 text-slate-400" /> {post.reading_minutes || 6} min
                read
              </span>
              <span
                className="inline-flex items-center gap-1.5"
                title={`${Number(post.view_count) || 0} reads`}
              >
                <Eye className="h-3.5 w-3.5 text-slate-400" /> {formatReadCount(post.view_count)}
              </span>
            </div>
          </m.div>

          <m.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
            className="relative"
          >
            <div className="overflow-hidden rounded-xl border border-[#e4e2f0] dark:border-white/8 bg-white dark:bg-[#131315] p-2 shadow-sm">
              <img
                src={post.thumbnail_url || '/ielts-hero-student.webp'}
                alt={getBlogCoverAlt(post)}
                width={BLOG_COVER_WIDTH}
                height={BLOG_COVER_HEIGHT}
                decoding="async"
                {...{ fetchpriority: 'high' }}
                className="aspect-video w-full rounded-lg object-cover"
              />
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}

function BlogPostArticleBody({ post, preparedContent, practicePath }) {
  return (
    <article className="rounded-xl border border-[#e4e2f0] dark:border-white/[0.07] bg-white dark:bg-[#141319] px-5 py-6 sm:px-8 sm:py-8 lg:px-9">
      <div
        className="prose prose-base max-w-none prose-slate prose-headings:scroll-mt-32 prose-headings:font-extrabold prose-headings:tracking-tight prose-h2:mb-3 prose-h2:mt-9 prose-h2:text-xl prose-h2:leading-tight prose-h3:mb-2.5 prose-h3:mt-7 prose-h3:text-lg prose-p:my-3.5 prose-p:text-sm prose-p:leading-relaxed prose-li:text-sm prose-li:leading-relaxed prose-a:font-bold prose-a:text-[#5a63df] prose-a:underline prose-a:decoration-[#5a63df]/30 prose-a:underline-offset-4 hover:prose-a:decoration-[#5a63df] prose-table:my-6 prose-table:text-xs prose-th:bg-[#f4f3fb] prose-th:px-3 prose-th:py-2.5 prose-td:px-3 prose-td:py-2.5 prose-blockquote:my-6 prose-blockquote:rounded-lg prose-blockquote:border-l-4 prose-blockquote:border-[#5a63df] prose-blockquote:bg-[#f4f3fb] prose-blockquote:px-5 prose-blockquote:py-4 prose-blockquote:text-sm prose-blockquote:font-semibold prose-blockquote:not-italic [&_p]:max-w-[86ch] [&_h2]:max-w-[86ch] [&_h3]:max-w-[86ch] [&_ul]:max-w-[86ch] [&_ol]:max-w-[86ch] [&_blockquote]:max-w-[86ch] [&_table]:my-6 [&_table]:block [&_table]:w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_th]:min-w-[125px] [&_td]:min-w-[125px] [&_aside]:my-6 [&_aside]:rounded-lg [&_aside]:border [&_aside]:border-[#e4e2f0] [&_aside]:bg-[#f4f3fb] [&_aside]:px-4 [&_aside]:py-3.5 [&_aside_p]:m-0 [&_aside_p]:text-slate-800 dark:prose-invert dark:prose-a:text-[#8f97ff] dark:prose-th:bg-white/5 dark:prose-blockquote:bg-white/4 dark:[&_aside]:border-white/10 dark:[&_aside]:bg-white/4 dark:[&_aside_p]:text-slate-200"
        dangerouslySetInnerHTML={{ __html: preparedContent.html }}
      />

      {post.seo_tags?.length > 0 && (
        <div className="mt-9 flex flex-wrap gap-1.5 border-t border-[#eceafa] dark:border-white/[0.07] pt-5">
          {post.seo_tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md border border-[#5a63df]/25 bg-[#5a63df]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5a63df] dark:border-[#8f97ff]/30 dark:bg-[#8f97ff]/15 dark:text-[#a9afff]"
            >
              <Tag className="h-3 w-3" /> {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-4 rounded-xl border border-[#e4e2f0] dark:border-white/[0.07] bg-linear-to-r/srgb from-[#f4f3fb] to-white dark:from-white/4 dark:to-white/2 p-5 sm:flex-row sm:items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#5a63df]/30 bg-[#5a63df]/10 text-[#5a63df] dark:border-[#8f97ff]/30 dark:bg-[#8f97ff]/15 dark:text-[#a9afff]">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#5a63df] dark:text-[#a9afff]">
            About this guide
          </p>
          <h2 className="mt-0.5 text-sm font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Reviewed by the IELTS Ai Pro editorial team
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            Built around practical IELTS preparation and linked to focused activities inside the
            application.
          </p>
        </div>
        <Button
          asChild
          className="rounded-lg font-bold text-xs bg-[#5a63df] hover:bg-[#4850c8] text-white"
        >
          <Link to={practicePath}>
            Practise now <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

function BlogPostRelatedPosts({ relatedPosts }) {
  if (relatedPosts.length === 0) return null;
  return (
    <section className="mt-7">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="text-base font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Related articles
        </h2>
        <Link
          to="/blog"
          className="text-xs font-bold text-[#5a63df] dark:text-[#a9afff] hover:underline"
        >
          View library →
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {relatedPosts.map((article) => (
          <RelatedCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}

function useTocActiveId(toc) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (!toc || toc.length === 0) return;

    const headingElements = toc.map((item) => document.getElementById(item.id)).filter(Boolean);

    if (headingElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -75% 0px',
      }
    );

    headingElements.forEach((el) => observer.observe(el));

    const handleScroll = () => {
      if (window.scrollY < 200 && headingElements.length > 0) {
        setActiveId(headingElements[0].id);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [toc]);

  return activeId;
}

function TableOfContents({ toc, activeId, className = '' }) {
  const [isOpenMobile, setIsOpenMobile] = useState(true);

  if (!toc || toc.length === 0) return null;

  return (
    <div
      className={`rounded-xl border border-[#e4e2f0] dark:border-white/[0.07] bg-linear-to-b/srgb from-white to-[#faf9ff] dark:from-[#141319] dark:to-[#100f15] p-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-[#5a63df]/30 bg-[#5a63df]/10 text-[#5a63df] dark:border-[#8f97ff]/30 dark:bg-[#8f97ff]/15 dark:text-[#a9afff]">
            <List className="h-3.5 w-3.5" />
          </span>
          <h2 className="text-[13px] font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            On this page
          </h2>
          <span className="ml-1 rounded-md border border-[#5a63df]/20 bg-[#5a63df]/10 px-1.5 py-0.5 text-[10px] font-mono tabular-nums font-bold text-[#5a63df] lg:hidden dark:border-[#8f97ff]/20 dark:bg-[#8f97ff]/15 dark:text-[#a9afff]">
            {toc.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpenMobile((prev) => !prev)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-[#f4f3fb] lg:hidden dark:hover:bg-white/5"
          aria-label={isOpenMobile ? 'Collapse table of contents' : 'Expand table of contents'}
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              isOpenMobile ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      <nav
        className={`mt-3 space-y-0.5 overflow-y-auto pr-1 transition-all duration-200 ${
          isOpenMobile ? 'block max-h-[55vh]' : 'hidden lg:block lg:max-h-[55vh]'
        }`}
        aria-label="Article sections"
      >
        {toc.map((item) => {
          const isActive = activeId === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`relative flex items-center rounded-lg py-1.5 px-2.5 text-xs transition-all duration-200 group ${
                isActive
                  ? 'bg-[#5a63df]/15 text-[#5a63df] font-extrabold dark:bg-[#8f97ff]/20 dark:text-[#a9afff]'
                  : 'text-slate-700 hover:bg-[#f4f3fb] hover:text-[#5a63df] dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-white font-medium'
              }`}
            >
              {isActive && (
                <span
                  className={`absolute w-0.5 rounded-full bg-[#5a63df] dark:bg-[#8f97ff] ${
                    item.level === 3 ? 'left-[14px] h-2.5' : 'left-[5px] h-3.5'
                  }`}
                />
              )}

              <span
                className={`${
                  item.level === 3
                    ? 'pl-4 text-[11px] text-slate-500 group-hover:text-slate-700 dark:text-slate-300 dark:group-hover:text-white'
                    : 'pl-1'
                }`}
              >
                {item.text}
              </span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}

function BlogPostSidebar({
  preparedContent,
  activeId,
  canonicalUrl,
  shareArticle,
  copyArticleLink,
  copied,
  practicePath,
  practiceLabel,
}) {
  return (
    <aside className="space-y-4 self-start lg:sticky lg:top-24">
      {preparedContent.toc.length > 0 && (
        <TableOfContents
          toc={preparedContent.toc}
          activeId={activeId}
          className="hidden lg:block"
        />
      )}

      <div className="rounded-xl border border-[#e4e2f0] dark:border-white/[0.07] bg-linear-to-b/srgb from-white to-[#faf9ff] dark:from-[#141319] dark:to-[#100f15] p-4">
        <div className="flex items-center gap-2">
          <Share2 className="h-3.5 w-3.5 text-[#5a63df] dark:text-[#a9afff]" />
          <h2 className="text-[13px] font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Share this article
          </h2>
        </div>
        <div className="mt-3 flex gap-2">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on Facebook"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e4e2f0] dark:border-white/10 bg-[#f4f3fb] dark:bg-white/4 text-blue-600 dark:text-blue-400 transition hover:bg-blue-50 dark:hover:bg-blue-500/10"
          >
            <Facebook className="h-4 w-4" />
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on LinkedIn"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e4e2f0] dark:border-white/10 bg-[#f4f3fb] dark:bg-white/4 text-sky-600 dark:text-sky-400 transition hover:bg-sky-50 dark:hover:bg-sky-500/10"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={shareArticle}
            aria-label="Share using device"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e4e2f0] dark:border-white/10 bg-[#f4f3fb] dark:bg-white/4 text-violet-600 dark:text-violet-400 transition hover:bg-violet-50 dark:hover:bg-violet-500/10"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={copyArticleLink}
            aria-label="Copy article link"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e4e2f0] dark:border-white/10 bg-[#f4f3fb] dark:bg-white/4 text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-white/8"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <SidebarPracticeCard
        title="Ready to put your knowledge into action?"
        subtitle="Take a practice test and see where you stand."
        actionLabel={practiceLabel}
        actionPath={practicePath}
      />

      <Link
        to="/blog"
        className="flex items-center justify-center gap-2 rounded-lg border border-[#e4e2f0] dark:border-white/[0.07] bg-white dark:bg-[#141319] px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition hover:border-[#5a63df]/30 hover:text-[#5a63df]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All IELTS articles
      </Link>
    </aside>
  );
}

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const countedResourceIdsRef = useRef(new Set());

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .eq('slug', slug)
          .eq('content_type', 'blog')
          .eq('is_published', true)
          .maybeSingle();

        if (error || !data) {
          toast.error('Post not found');
          navigate('/blog');
          return;
        }

        setPost(data);
        const { data: related } = await supabase
          .from('resources')
          .select(
            'id,title,slug,description,category,reading_minutes,published_at,created_at,thumbnail_url'
          )
          .eq('content_type', 'blog')
          .eq('is_published', true)
          .neq('id', data.id)
          .order('published_at', { ascending: false, nullsFirst: false })
          .limit(3);
        setRelatedPosts(related || []);
        const readStorageKey = `ielts-blog-read:${data.id}`;
        let hasBeenCounted = countedResourceIdsRef.current.has(data.id);
        try {
          hasBeenCounted = hasBeenCounted || window.sessionStorage.getItem(readStorageKey) === '1';
        } catch {
          // Privacy settings can disable session storage; the read can still be counted.
        }

        if (!hasBeenCounted) {
          countedResourceIdsRef.current.add(data.id);
          const { error: viewError } = await supabase.rpc('increment_resource_view', {
            resource_id: data.id,
          });
          if (!viewError) {
            try {
              window.sessionStorage.setItem(readStorageKey, '1');
            } catch {
              // The in-memory guard still prevents duplicate counts during this visit.
            }
            setPost((currentPost) =>
              currentPost
                ? { ...currentPost, view_count: (Number(currentPost.view_count) || 0) + 1 }
                : currentPost
            );
          } else {
            countedResourceIdsRef.current.delete(data.id);
          }
        }
      } catch (error) {
        console.error('Error fetching blog post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug, navigate]);

  const preparedContent = prepareArticleContent(post?.content);
  const activeId = useTocActiveId(preparedContent.toc);
  const seoMeta = getBlogSeoMeta({
    ...post,
    description: post?.description || getExcerpt(post?.content),
  });
  const description = seoMeta.description;
  const practicePath = PRACTICE_LINKS[post?.category] || '/signup';
  const practiceLabel =
    PRACTICE_LABELS[post?.category] || `Start ${post?.category || 'IELTS'} practice`;
  const publishedDate = post?.published_at || post?.created_at;
  const canonicalUrl = `https://www.ieltsai.pro/blog/${slug}`;
  const socialImageUrl = absoluteImageUrl(post?.thumbnail_url);

  const copyArticleLink = async () => {
    try {
      await navigator.clipboard.writeText(canonicalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Could not copy the article link');
    }
  };

  const shareArticle = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: description, url: canonicalUrl });
        return;
      }
      await copyArticleLink();
    } catch (error) {
      if (error?.name !== 'AbortError') toast.error('Could not share this article');
    }
  };

  if (loading) return <BlogPostLoadingSkeleton />;
  if (!post) return null;

  return (
    <>
      <DocumentHead
        title={seoMeta.title}
        description={description}
        canonicalUrl={canonicalUrl}
        image={socialImageUrl}
        type="article"
        keywords={seoMeta.keywords.join(', ')}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description,
          image: socialImageUrl,
          datePublished: publishedDate,
          dateModified: post.updated_at || publishedDate,
          author: { '@type': 'Organization', name: 'IELTS Ai Pro' },
          publisher: { '@type': 'Organization', name: 'IELTS Ai Pro' },
          mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
        }}
      />

      <div className="min-h-screen bg-[#f7f9ff] font-sans text-slate-950 dark:bg-[#080b12] dark:text-white">
        <PublicNavbar />

        <main className="pt-16">
          <BlogPostHero post={post} publishedDate={publishedDate} />

          <section className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-6 px-5 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:py-10">
            <div className="min-w-0">
              {preparedContent.toc.length > 0 && (
                <div className="mb-6 lg:hidden">
                  <TableOfContents toc={preparedContent.toc} activeId={activeId} />
                </div>
              )}
              <BlogPostArticleBody
                post={post}
                preparedContent={preparedContent}
                practicePath={practicePath}
              />
              <BlogPostRelatedPosts relatedPosts={relatedPosts} />
            </div>

            <BlogPostSidebar
              preparedContent={preparedContent}
              activeId={activeId}
              canonicalUrl={canonicalUrl}
              shareArticle={shareArticle}
              copyArticleLink={copyArticleLink}
              copied={copied}
              practicePath={practicePath}
              practiceLabel={practiceLabel}
            />
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

function PenLineIcon({ category }) {
  if (category === 'Reading') return <BookOpen className="h-3.5 w-3.5" />;
  if (category === 'Listening') return <Headphones className="h-3.5 w-3.5" />;
  if (category === 'Speaking') return <Mic2 className="h-3.5 w-3.5" />;
  if (category === 'Study Planning' || category === 'Mock Tests')
    return <GraduationCap className="h-3.5 w-3.5" />;
  if (category === 'Writing') return <PenLine className="h-3.5 w-3.5" />;
  return <Sparkles className="h-3.5 w-3.5" />;
}

export default BlogPost;
