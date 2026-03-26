import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  ArrowLeft,
  Share2,
  Bookmark,
  Eye,
  Tag,
  ChevronRight,
  Home,
  MessageCircle,
  ThumbsUp,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';
import DocumentHead from '@/components/shared/DocumentHead';

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(0);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error || !data) {
          toast.error('Post not found');
          navigate('/resources');
          return;
        }

        setPost(data);

        // Increment view count
        await supabase.rpc('increment_resource_view', { resource_id: data.id });
      } catch (err) {
        console.error('Error fetching blog post:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      if (totalScroll <= 0) {
        setScrolled(0);
        return;
      }
      setScrolled((currentScroll / totalScroll) * 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div
        className="min-h-screen bg-slate-50 dark:bg-[#020617] transition-colors duration-500"
        data-oid="j_4bqok"
      >
        <div className="max-w-4xl mx-auto px-6 py-20 space-y-8" data-oid="3ko8geh">
          <Skeleton className="h-10 w-2/3" data-oid="4l1ze4c" />
          <Skeleton className="h-6 w-1/3" data-oid="nu1z5hr" />
          <Skeleton className="aspect-[21/9] w-full rounded-[2.5rem]" data-oid="pja-ax3" />
          <div className="space-y-4 pt-12" data-oid="l7mi06_">
            <Skeleton className="h-4 w-full" data-oid="t.kd481" />
            <Skeleton className="h-4 w-full" data-oid="b69_t5z" />
            <Skeleton className="h-4 w-3/4" data-oid="anzu80l" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  // Generate excerpt for meta description (first 160 chars of plain text)
  const getExcerpt = (htmlContent) => {
    const div = document.createElement('div');
    div.innerHTML = htmlContent || '';
    const text = div.textContent || div.innerText || '';
    return text.substring(0, 160).trim() + (text.length > 160 ? '...' : '');
  };

  return (
    <>
      <DocumentHead
        title={post.title}
        description={post.meta_description || getExcerpt(post.content)}
        canonicalUrl={`https://www.ieltsai.pro/blog/${slug}`}
        image={post.thumbnail_url || 'https://www.ieltsai.pro/og-image.png'}
        type="article"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.meta_description || getExcerpt(post.content),
          image: post.thumbnail_url,
          datePublished: post.created_at,
          dateModified: post.updated_at || post.created_at,
          author: {
            '@type': 'Organization',
            name: 'IELTS Ai Pro',
          },
          publisher: {
            '@type': 'Organization',
            name: 'IELTS Ai Pro',
            logo: {
              '@type': 'ImageObject',
              url: 'https://www.ieltsai.pro/logo.png',
            },
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://www.ieltsai.pro/blog/${slug}`,
          },
        }}
        data-oid="3bf-s1:"
      />

      <div
        className="relative min-h-screen bg-slate-50 dark:bg-[#020617] selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-indigo-100 font-sans transition-colors duration-500 overflow-x-hidden"
        data-oid="8au_e6w"
      >
        {/* Premium Background System */}
        <div
          aria-hidden="true"
          className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
          data-oid="cqlwa0g"
        >
          <div
            className="absolute top-[-10%] left-[-10%] w-[70rem] h-[70rem] rounded-full bg-slate-200/30 dark:bg-indigo-950/20 blur-[120px]"
            data-oid=":oztpis"
          />

          <div
            className="absolute bottom-[-20%] right-[-10%] w-[60rem] h-[60rem] rounded-full bg-indigo-100/20 dark:bg-slate-900/10 blur-[120px]"
            data-oid="r3wpc-v"
          />

          <div
            className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:48px_48px]"
            data-oid="j87cpb2"
          />
        </div>

        {/* Reading Progress Bar */}
        <div
          className="fixed top-0 left-0 w-full h-1 z-[110] bg-slate-100 dark:bg-white/5"
          data-oid="d9sdu09"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
            style={{ width: `${scrolled}%` }}
            data-oid="zt94_tp"
          />
        </div>

        {/* Navigation Header */}
        <nav
          className="sticky top-0 z-50 bg-white/60 dark:bg-[#020617]/60 backdrop-blur-2xl border-b border-slate-200/50 dark:border-white/5 py-5 transition-all"
          data-oid="k4sj0uu"
        >
          <div
            className="max-w-7xl mx-auto px-6 flex items-center justify-between"
            data-oid="t634-j0"
          >
            <div className="flex items-center gap-6" data-oid="reacz3h">
              <Link
                to="/resources"
                className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-indigo-500 hover:text-indigo-500 transition-all group shadow-sm active:scale-90"
                data-oid="advvij3"
              >
                <ArrowLeft
                  className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
                  data-oid="jh1.:2h"
                />
              </Link>
              <div
                className="hidden md:flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"
                data-oid="37ame9o"
              >
                <Link
                  to="/resources"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                  data-oid="-ca:pwb"
                >
                  Resources
                </Link>
                <ChevronRight className="w-3.5 h-3.5 opacity-50" data-oid="t5g.p77" />
                <span
                  className="text-indigo-600 dark:text-indigo-400 truncate max-w-[250px]"
                  data-oid="ip1w:sc"
                >
                  {post.title}
                </span>
              </div>
            </div>
          </div>
        </nav>

        <div className="relative z-10" data-oid="d0wsv3r">
          {/* Hero Section */}
          <header className="relative pt-20 lg:pt-32 pb-16 overflow-hidden" data-oid="q:qwk_f">
            <div className="max-w-4xl mx-auto px-6 text-center" data-oid="_1fdnj7">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center justify-center gap-4 mb-10"
                data-oid="ce03i4h"
              >
                <Badge
                  className="px-4 py-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 rounded-full font-black uppercase tracking-widest text-[10px]"
                  data-oid="iqyggj6"
                >
                  <Sparkles className="w-3 h-3 mr-2 inline-block -mt-1" data-oid="xnr36li" />
                  Premium Guide
                </Badge>
                <div
                  className="flex items-center gap-2.5 text-xs font-black text-slate-400 uppercase tracking-widest"
                  data-oid="kjvsq-u"
                >
                  <Clock className="w-4 h-4" data-oid=":rfyygm" />
                  {Math.ceil(post.content?.length / 1000) || 5} min read
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-slate-900 dark:text-white mb-10 leading-[1.05]"
                data-oid="m5xx:l-"
              >
                {post.title}
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-center gap-8 text-slate-500 dark:text-slate-400 pb-16"
                data-oid="m29jeal"
              >
                <div className="flex items-center gap-3 font-bold text-sm" data-oid="7g3kxj_">
                  <div
                    className="w-10 h-10 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-sm"
                    data-oid="kzj4zw1"
                  >
                    <User className="w-5 h-5 text-indigo-500" data-oid="njc2q-k" />
                  </div>
                  <span
                    className="dark:text-white font-black uppercase tracking-widest text-[11px]"
                    data-oid="rxrjl-c"
                  >
                    IELTS Pro Team
                  </span>
                </div>
                <div
                  className="w-2 h-2 rounded-full bg-slate-200 dark:bg-white/10"
                  data-oid="ge1y:fw"
                />

                <div
                  className="flex items-center gap-3 font-bold text-sm uppercase tracking-widest text-[11px]"
                  data-oid="yg19ejy"
                >
                  <Calendar className="w-4 h-4" data-oid="t56r:m:" />
                  <span data-oid="_lsl9o2">
                    {new Date(post.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </motion.div>
            </div>

            {post.thumbnail_url && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="max-w-6xl mx-auto px-6"
                data-oid="37lsooi"
              >
                <div
                  className="relative aspect-[21/9] rounded-[3rem] lg:rounded-[4rem] overflow-hidden shadow-2xl border border-slate-200/50 dark:border-white/5 group"
                  data-oid="9x7t0k6"
                >
                  <img
                    src={post.thumbnail_url}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    data-oid="k.gc6i_"
                  />

                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"
                    data-oid="ns:ajyz"
                  />
                </div>
              </motion.div>
            )}
          </header>

          {/* Content Section */}
          <main className="max-w-4xl mx-auto px-6 pb-32" data-oid="iy89ul0">
            <article
              className="prose prose-xl dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-img:rounded-[2.5rem] prose-blockquote:border-l-indigo-600 prose-blockquote:bg-indigo-50/30 dark:prose-blockquote:bg-indigo-900/10 dark:prose-blockquote:border-2 dark:prose-blockquote:border-l-[12px] dark:prose-blockquote:border-indigo-600/50 prose-blockquote:py-8 prose-blockquote:px-10 prose-blockquote:not-italic prose-blockquote:text-2xl prose-blockquote:font-black prose-blockquote:tracking-tight prose-blockquote:rounded-3xl"
              data-oid="n4sckaj"
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(post.content),
                }}
                data-oid="20tdvw6"
              />
            </article>

            {/* Footer Section of Article */}
            <div
              className="mt-24 pt-16 border-t border-slate-200 dark:border-white/5"
              data-oid="h197whq"
            >
              <div
                className="flex flex-col md:flex-row items-center justify-between gap-10"
                data-oid="olo0il2"
              >
                <div className="flex flex-wrap gap-3" data-oid="8hvk21p">
                  {post.seo_tags?.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="rounded-2xl px-5 py-2 flex items-center gap-2 font-black uppercase text-[10px] tracking-[0.15em] text-slate-500 hover:text-indigo-600 hover:border-indigo-600 bg-white/50 dark:bg-white/5 transition-all cursor-pointer hover:shadow-lg active:scale-95"
                      data-oid="tm:pmu."
                    >
                      <Tag className="w-3.5 h-3.5" data-oid="jdms878" />
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-5" data-oid="g9b6l4o">
                  <button
                    className="flex items-center gap-3 group active:scale-90 transition-transform"
                    data-oid="hnfkv60"
                  >
                    <span
                      className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:bg-rose-500 group-hover:border-rose-500 transition-all shadow-sm"
                      data-oid="bjmi5hz"
                    >
                      <ThumbsUp
                        className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors"
                        data-oid="3_c0bw6"
                      />
                    </span>
                    <span
                      className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white"
                      data-oid="q4tsjw9"
                    >
                      Helpful
                    </span>
                  </button>
                  <button
                    className="flex items-center gap-3 group active:scale-90 transition-transform"
                    data-oid="udp_qy7"
                  >
                    <span
                      className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all shadow-sm"
                      data-oid="7aafb.8"
                    >
                      <MessageCircle
                        className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors"
                        data-oid="4hettoa"
                      />
                    </span>
                    <span
                      className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white"
                      data-oid="rvxrd2i"
                    >
                      Discuss
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Premium Author Box */}
            <div
              className="mt-24 p-10 md:p-16 rounded-[4rem] bg-gradient-to-br from-indigo-600 to-indigo-700 text-white relative overflow-hidden group shadow-[0_40px_80px_-15px_rgba(79,70,229,0.3)]"
              data-oid="w8x7n.v"
            >
              <div
                className="absolute top-0 right-0 w-[500px] h-[500px] bg-white text-white opacity-5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-white transition-all duration-1000"
                data-oid="as4fwmk"
              />

              <div
                className="relative z-10 flex flex-col md:flex-row items-center gap-12"
                data-oid="2dza7v4"
              >
                <div
                  className="w-32 h-32 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center border-4 border-white/20 relative group-hover:scale-105 transition-transform duration-500"
                  data-oid="s-l0e_y"
                >
                  <Sparkles
                    className="w-14 h-14 text-indigo-600 animate-pulse"
                    data-oid="0zfaqbi"
                  />
                </div>
                <div className="flex-1 text-center md:text-left space-y-4" data-oid="dwpgfku">
                  <div className="space-y-1" data-oid="k:nd4ba">
                    <span
                      className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60"
                      data-oid=".ldzu0c"
                    >
                      Article Author
                    </span>
                    <h4
                      className="text-3xl font-black tracking-tight leading-none"
                      data-oid="cnaspae"
                    >
                      IELTS Mastery Academy
                    </h4>
                  </div>
                  <p
                    className="text-indigo-50 font-medium leading-relaxed opacity-90 text-lg"
                    data-oid="f8xj5hr"
                  >
                    Our expert educators and linguists specialize in high-impact IELTS preparation
                    strategy. Every resource is crafted to provide you with a definitive advantage
                    on your test day.
                  </p>
                  <div
                    className="pt-6 flex flex-wrap justify-center md:justify-start gap-4"
                    data-oid="inz46rs"
                  >
                    <Button
                      className="bg-white text-indigo-600 hover:bg-white/90 rounded-[1.5rem] px-10 font-bold uppercase tracking-widest h-16 shadow-2xl shadow-indigo-900/50 text-sm active:scale-95 transition-all border-0"
                      data-oid=":h31d-e"
                    >
                      Explore More Guides
                    </Button>
                    <Button
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 rounded-[1.5rem] px-10 font-bold uppercase tracking-widest h-16 text-sm backdrop-blur-sm active:scale-95 transition-all"
                      data-oid="j393crp"
                    >
                      Refer a Friend
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>

        <style data-oid="k4nl7w-">{`
                article h2 {
                    font-size: 3rem !important;
                    margin-top: 2.5em !important;
                    margin-bottom: 0.75em !important;
                    line-height: 1.1 !important;
                }
                article h3 {
                    font-size: 2rem !important;
                    margin-top: 2em !important;
                    margin-bottom: 0.5em !important;
                }
                article p {
                    font-size: 1.25rem !important;
                    line-height: 1.8 !important;
                    margin-bottom: 1.75em !important;
                    color: inherit;
                    opacity: 0.95;
                    font-weight: 500;
                }
                article strong {
                    font-weight: 900 !important;
                    color: #4F46E5 !important;
                    letter-spacing: -0.01em;
                }
                @media (max-width: 768px) {
                    article h2 { font-size: 2.25rem !important; }
                    article h3 { font-size: 1.75rem !important; }
                    article p { font-size: 1.125rem !important; }
                }
            `}</style>
      </div>
    </>
  );
};

export default BlogPost;
