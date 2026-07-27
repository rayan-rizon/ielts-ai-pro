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

const PRACTICE_LINKS = {
  Writing: '/writing',
  Speaking: '/speaking',
  Reading: '/reading',
  Listening: '/listening',
  'Study Planning': '/cambridge-tests',
  'Exam Updates': '/cambridge-tests',
};

const PRACTICE_LABELS = {
  'Study Planning': 'Start a mock test',
  'Exam Updates': 'Start a mock test',
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
  const cleanHtml = DOMPurify.sanitize(content || '');
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
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-indigo-200 dark:border-white/10 dark:bg-slate-900">
      <Link to={`/blog/${article.slug}`}>
        <div className="relative h-32 overflow-hidden bg-indigo-50 dark:bg-indigo-500/10">
          <img
            src={article.thumbnail_url || '/ielts-hero-student.webp'}
            alt={getBlogCoverAlt(article)}
            width={BLOG_COVER_WIDTH}
            height={BLOG_COVER_HEIGHT}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-indigo-700 shadow-sm backdrop-blur">
            {article.category || 'IELTS Guide'}
          </span>
        </div>
        <div className="p-4">
          <h3 className="line-clamp-2 text-sm font-extrabold leading-5 tracking-[-0.015em] group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
            {article.title}
          </h3>
          <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
            Read guide <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </Link>
    </article>
  );
}

function BlogPostLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#f7f9ff] dark:bg-[#080b12]">
      <PublicNavbar />
      <div className="mx-auto grid max-w-7xl gap-8 px-5 pb-14 pt-28 sm:px-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-16 w-4/5" />
        </div>
        <Skeleton className="aspect-[16/9] rounded-3xl" />
      </div>
    </div>
  );
}

function BlogPostHero({ post, publishedDate }) {
  return (
    <section className="relative overflow-hidden border-b border-indigo-100 bg-white dark:border-white/10 dark:bg-[#0b0f18]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_30%,rgba(99,102,241,.08),transparent_26%),radial-gradient(circle_at_85%_10%,rgba(45,212,191,.08),transparent_25%)]" />
      <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:py-14">
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500"
        >
          <Link to="/blog" className="hover:text-indigo-700">
            Blog library
          </Link>
          <span>/</span>
          <span>{post.category || 'Guide'}</span>
          <span>/</span>
          <span className="max-w-[260px] truncate text-slate-700 dark:text-slate-300">
            {post.title}
          </span>
        </nav>

        <div className="grid items-center gap-9 lg:grid-cols-[.95fr_1.05fr]">
          <m.div
            initial={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[.1em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <PenLineIcon category={post.category} /> {post.category || 'IELTS Guide'}
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-[-0.045em] sm:text-5xl lg:text-[3.35rem]">
              {post.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
              {post.description}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <UserRound className="h-4 w-4" />
                </span>
                IELTS Ai Pro team
              </span>
              <span className="hidden h-5 w-px bg-slate-200 sm:block dark:bg-white/10" />
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" /> {formatDate(publishedDate)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" /> {post.reading_minutes || 6} min read
              </span>
              <span
                className="inline-flex items-center gap-2"
                title={`${Number(post.view_count) || 0} reads`}
              >
                <Eye className="h-4 w-4" /> {formatReadCount(post.view_count)}
              </span>
            </div>
          </m.div>

          <m.div
            initial={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
            className="relative"
          >
            <div className="overflow-hidden rounded-[1.75rem] border border-indigo-100 bg-indigo-50 p-2 shadow-[0_28px_70px_-38px_rgba(79,70,229,.5)] dark:border-white/10 dark:bg-white/[.04]">
              <img
                src={post.thumbnail_url || '/ielts-hero-student.webp'}
                alt={getBlogCoverAlt(post)}
                width={BLOG_COVER_WIDTH}
                height={BLOG_COVER_HEIGHT}
                decoding="async"
                {...{ fetchpriority: 'high' }}
                className="aspect-[16/9] w-full rounded-[1.35rem] object-cover"
              />
            </div>
            <div className="absolute -bottom-4 left-8 hidden rotate-[-3deg] rounded-lg bg-violet-100 px-4 py-3 text-xs font-bold text-violet-800 shadow-lg sm:block">
              Plan · Practise · Review · Succeed
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}

function BlogPostArticleBody({ post, preparedContent, practicePath }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white px-5 py-7 shadow-[0_18px_50px_-38px_rgba(15,23,42,.3)] sm:px-8 sm:py-9 lg:px-10 dark:border-white/10 dark:bg-slate-900">
      <div
        className="prose prose-lg max-w-none prose-slate prose-headings:scroll-mt-32 prose-headings:font-extrabold prose-headings:tracking-[-0.025em] prose-h2:mb-4 prose-h2:mt-11 prose-h2:text-[1.65rem] prose-h2:leading-tight prose-h3:mb-3 prose-h3:mt-8 prose-h3:text-xl prose-p:my-4 prose-p:text-[1.035rem] prose-p:leading-[1.78] prose-li:text-[1.035rem] prose-li:leading-[1.7] prose-a:font-bold prose-a:text-indigo-700 prose-a:underline prose-a:decoration-indigo-200 prose-a:underline-offset-4 hover:prose-a:decoration-indigo-600 prose-table:my-8 prose-table:text-sm prose-th:bg-indigo-50 prose-th:px-4 prose-th:py-3 prose-td:px-4 prose-td:py-3 prose-blockquote:my-8 prose-blockquote:rounded-r-xl prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-gradient-to-r prose-blockquote:from-indigo-50 prose-blockquote:to-violet-50/50 prose-blockquote:px-6 prose-blockquote:py-5 prose-blockquote:text-lg prose-blockquote:font-semibold prose-blockquote:not-italic [&_aside]:my-7 [&_aside]:rounded-xl [&_aside]:border [&_aside]:border-indigo-200 [&_aside]:bg-gradient-to-r [&_aside]:from-indigo-50 [&_aside]:to-violet-50 [&_aside]:px-5 [&_aside]:py-4 [&_aside_p]:m-0 [&_aside_p]:text-indigo-950 dark:prose-invert dark:prose-a:text-indigo-300 dark:prose-th:bg-indigo-500/10 dark:prose-blockquote:from-indigo-500/10 dark:prose-blockquote:to-violet-500/5 dark:[&_aside]:border-indigo-500/20 dark:[&_aside]:from-indigo-500/10 dark:[&_aside]:to-violet-500/10 dark:[&_aside_p]:text-indigo-100"
        dangerouslySetInnerHTML={{ __html: preparedContent.html }}
      />

      {post.seo_tags?.length > 0 && (
        <div className="mt-11 flex flex-wrap gap-2 border-t border-slate-200 pt-6 dark:border-white/10">
          {post.seo_tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
            >
              <Tag className="h-3 w-3" /> {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-10 flex flex-col gap-5 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-6 sm:flex-row sm:items-center dark:border-indigo-500/20 dark:from-indigo-500/10 dark:to-violet-500/10">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-300">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-indigo-600 dark:text-indigo-300">
            About this guide
          </p>
          <h2 className="mt-1 text-lg font-extrabold">
            Reviewed by the IELTS Ai Pro editorial team
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Built around practical IELTS preparation and linked to focused activities inside the
            application.
          </p>
        </div>
        <Button asChild className="rounded-xl font-bold">
          <Link to={practicePath}>
            Practise now <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

function BlogPostRelatedPosts({ relatedPosts }) {
  if (relatedPosts.length === 0) return null;
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-extrabold tracking-[-0.025em]">Related articles</h2>
        <Link to="/blog" className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
          View library →
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_15px_40px_-32px_rgba(15,23,42,.3)] dark:border-white/10 dark:bg-slate-900 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
            <List className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-extrabold">On this page</h2>
          <span className="ml-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 lg:hidden dark:bg-indigo-500/10 dark:text-indigo-300">
            {toc.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpenMobile((prev) => !prev)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-white/10"
          aria-label={isOpenMobile ? 'Collapse table of contents' : 'Expand table of contents'}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpenMobile ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      <nav
        className={`mt-4 space-y-1 overflow-y-auto pr-1 transition-all duration-200 ${
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
              className={`relative flex items-center rounded-xl py-2 px-3 text-xs transition-all duration-200 group ${
                isActive
                  ? 'bg-indigo-50/70 text-indigo-700 font-bold dark:bg-indigo-500/10 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.03]'
              }`}
            >
              {isActive && (
                <span
                  className={`absolute w-0.5 rounded-full bg-indigo-600 dark:bg-indigo-400 ${
                    item.level === 3 ? 'left-[16px] h-2.5' : 'left-[6px] h-4'
                  }`}
                />
              )}

              <span
                className={`${
                  item.level === 3
                    ? 'pl-5 text-[11px] text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300'
                    : 'pl-2'
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
    <aside className="space-y-5 self-start lg:sticky lg:top-24">
      {preparedContent.toc.length > 0 && (
        <TableOfContents
          toc={preparedContent.toc}
          activeId={activeId}
          className="hidden lg:block"
        />
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-indigo-600" />
          <h2 className="text-sm font-extrabold">Share this article</h2>
        </div>
        <div className="mt-4 flex gap-2">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Share on Facebook"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition hover:bg-blue-100"
          >
            <Facebook className="h-4 w-4" />
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Share on LinkedIn"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-700 transition hover:bg-sky-100"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={shareArticle}
            aria-label="Share using device"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50 text-violet-700 transition hover:bg-violet-100"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={copyArticleLink}
            aria-label="Copy article link"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
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
        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" /> All IELTS articles
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
  const [scrolled, setScrolled] = useState(0);
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

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(totalScroll > 0 ? Math.min((window.scrollY / totalScroll) * 100, 100) : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const preparedContent = prepareArticleContent(post?.content);
  const activeId = useTocActiveId(preparedContent.toc);
  const description = post?.meta_description || post?.description || getExcerpt(post?.content);
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
        title={post.title}
        description={description}
        canonicalUrl={canonicalUrl}
        image={socialImageUrl}
        type="article"
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
        <div className="fixed left-0 top-0 z-[120] h-0.5 w-full bg-slate-100 dark:bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
            style={{ width: `${scrolled}%` }}
          />
        </div>

        <PublicNavbar />

        <main className="pt-16">
          <BlogPostHero post={post} publishedDate={publishedDate} />

          <section className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-6 px-5 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:py-10">
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
  if (category === 'Study Planning') return <GraduationCap className="h-3.5 w-3.5" />;
  if (category === 'Writing') return <PenLine className="h-3.5 w-3.5" />;
  return <Sparkles className="h-3.5 w-3.5" />;
}

export default BlogPost;
