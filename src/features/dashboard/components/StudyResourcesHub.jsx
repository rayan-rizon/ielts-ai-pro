import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  FileText,
  Download,
  Youtube,
  GraduationCap,
  ArrowRight,
  Star,
  Play,
  ChevronDown,
  ExternalLink,
  Eye,
  PlayCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Resource } from '@/entities';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Skeleton } from '@/components/ui/skeleton';

const StudyResourcesHub = React.memo(
  ({ initialResources = [], isLoading: parentLoading = false }) => {
    const [expanded, setExpanded] = useState(true);
    const navigate = useNavigate();

    const resources = initialResources;
    const isLoading = parentLoading;

    const videos = resources.filter((r) => r.content_type === 'video').slice(0, 3);
    const books = resources.filter((r) => r.content_type === 'pdf').slice(0, 4);

    const handleOpenResource = (resource) => {
      Resource.incrementViewCount(resource.id);
      if (resource.content_type === 'blog' && resource.slug) {
        navigate(`/blog/${resource.slug}`);
      } else {
        window.open(resource.url, '_blank', 'noopener,noreferrer');
      }
    };

    /**
     * Improved Compact Video Card
     */
    const VideoCard = ({ item }) => {
      const getThumbnail = () => {
        if (item.thumbnail_url) return item.thumbnail_url;
        const embedInfo = Resource.getVideoEmbedInfo(item.url);
        if (embedInfo?.type === 'youtube') {
          return `https://img.youtube.com/vi/${embedInfo.id}/mqdefault.jpg`;
        }
        return null;
      };

      return (
        <motion.div
          whileHover={{ scale: 1.01, x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleOpenResource(item)}
          className={cn(
            'group/item relative flex items-start gap-4 p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 shadow-sm cursor-pointer transition-all duration-300',
            'hover:bg-white/80 dark:hover:bg-slate-900 hover:shadow-lg dark:hover:shadow-rose-500/10 hover:border-rose-500/20'
          )}
        >
          {/* Thumbnail with Overlay */}
          <div className="w-28 aspect-video rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 relative border border-slate-200 dark:border-white/5 group-hover/item:border-rose-500/20 transition-colors">
            {getThumbnail() ? (
              <img
                src={getThumbnail()}
                alt=""
                className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-rose-500/10">
                <PlayCircle className="w-8 h-8 text-rose-500/50" />
              </div>
            )}

            {/* Play Button Overlay */}
            <div className="absolute inset-0 bg-black/10 group-hover/item:bg-black/20 transition-colors flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                <Play className="w-5 h-5 text-rose-600 fill-rose-600 ml-1" />
              </div>
            </div>

            {/* Duration Badge (Mocked or Real if available) */}
            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-[8px] font-bold text-white">
              WATCH
            </div>
          </div>

          <div className="flex-1 min-w-0 py-0.5">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug line-clamp-2 group-hover/item:text-rose-600 dark:group-hover/item:text-rose-400 transition-colors mb-1.5">
              {item.title}
            </h4>

            {item.description && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium line-clamp-2 leading-relaxed mb-2">
                {item.description}
              </p>
            )}

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
                <Eye className="w-3 h-3 text-slate-300 dark:text-slate-500" />
                {item.view_count || 0} views
              </span>
            </div>
          </div>

          <button className="self-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors opacity-0 group-hover/item:opacity-100">
            <ExternalLink className="w-4 h-4" />
          </button>
        </motion.div>
      );
    };

    /**
     * Improved Compact Book Card
     */
    const BookCard = ({ item }) => {
      const thumbnail = item.thumbnail_url;

      return (
        <motion.div
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleOpenResource(item)}
          className={cn(
            'group/item relative flex flex-col items-center gap-2 p-1.5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 shadow-sm cursor-pointer transition-all duration-300',
            'hover:bg-white/80 dark:hover:bg-slate-900 hover:shadow-xl dark:hover:shadow-blue-500/10 hover:border-blue-500/20'
          )}
        >
          {/* 3D Book Cover Effect */}
          <div className="w-20 h-28 rounded-r-md rounded-l-sm overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 relative border-y border-r border-slate-200 dark:border-white/5 shadow-[2px_1px_4px_rgba(0,0,0,0.1)] transition-transform group-hover/item:-rotate-2 group-hover/item:translate-x-1 duration-300 after:absolute after:inset-y-0 after:left-0 after:w-1 after:bg-gradient-to-r after:from-black/20 after:to-transparent">
            {thumbnail ? (
              <img src={thumbnail} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 p-2 text-center">
                <FileText className="w-6 h-6 text-white/40 mb-1" />
                <span className="text-[6px] text-white font-bold leading-tight line-clamp-3 uppercase tracking-wider">
                  {item.title}
                </span>
              </div>
            )}

            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/0 via-white/10 to-white/20 pointer-events-none" />
          </div>

          <div className="w-full min-w-0 py-0.5 text-center">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs leading-snug line-clamp-2 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors mb-1">
              {item.title}
            </h4>

            <div className="flex items-center justify-center gap-3">
              <span className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
                <BookOpen className="w-3 h-3 text-slate-300 dark:text-slate-500" />
                {item.view_count || 0} reads
              </span>
            </div>
          </div>
        </motion.div>
      );
    };

    return (
      <Card
        className={cn(
          'rounded-2xl transition-all duration-300 overflow-hidden group',
          'bg-white/60 dark:bg-slate-900/50 backdrop-blur-2xl',
          'border border-white/60 dark:border-white/[0.12]',
          'shadow-[0_10px_40px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]',
          'hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.2)] dark:hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.6)]',
          'hover:border-indigo-500/40 dark:hover:border-indigo-500/40'
        )}
      >
        <CardHeader className="p-3 md:p-3 pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-500/20 transition-transform group-hover:rotate-12">
                <GraduationCap className="w-6 h-6 transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div>
                <span className="tracking-tight">Study Resources</span>
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none mt-1">
                  Knowledge Base
                </p>
              </div>
            </CardTitle>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(createPageUrl('Resources'))}
                className="h-9 px-4 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl"
              >
                Full Library <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
              <motion.button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-4 py-2 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/5"
              >
                {expanded ? 'Collapse' : 'Expand'}
                <ChevronDown
                  className={cn(
                    'w-3 h-3 transition-transform duration-300',
                    expanded && 'rotate-180'
                  )}
                />
              </motion.button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 md:p-3 pt-0">
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="expanded"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                {isLoading ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-1">
                    {/* Left Column: Videos */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-rose-500/10">
                            <Youtube className="w-3.5 h-3.5 text-rose-500" />
                          </div>
                          <div>
                            <span className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
                              Premium Video Lessons
                            </span>
                          </div>
                        </div>
                      </div>

                      {videos.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                          {videos.map((item) => (
                            <VideoCard key={item.id} item={item} />
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            No videos available yet.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Books */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-blue-500/10">
                            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                          </div>
                          <div>
                            <span className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
                              Essential Study Guides
                            </span>
                          </div>
                        </div>
                      </div>

                      {books.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {books.map((item) => (
                            <BookCard key={item.id} item={item} />
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Check back soon for new guides!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    );
  }
);

StudyResourcesHub.displayName = 'StudyResourcesHub';

export default StudyResourcesHub;
