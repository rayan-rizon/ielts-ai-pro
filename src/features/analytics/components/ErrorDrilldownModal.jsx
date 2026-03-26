import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  Zap,
  BookOpen,
  Headphones,
  PenTool,
  Mic2,
  Calendar,
  ArrowRight,
  TrendingDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const TYPE_ICONS = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenTool,
  speaking: Mic2,
};

const TYPE_COLORS = {
  reading: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  listening: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  writing: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  speaking: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
};

const CATEGORY_META = {
  rushed: {
    title: 'Rushed Sessions',
    description: 'Sessions where speed caused accuracy drops.',
    icon: Zap,
    color: 'text-rose-500',
  },
  overanalyzed: {
    title: 'Overanalyzed Sessions',
    description: 'Sessions where too much time was spent per question.',
    icon: Clock,
    color: 'text-amber-500',
  },
  nearMisses: {
    title: 'Near Misses',
    description: 'Almost correct! One small slip cost the point.',
    icon: TrendingDown,
    color: 'text-primary',
  },
  unanswered: {
    title: 'Unanswered Questions',
    description: 'Missed opportunities. Always try to guess if unsure.',
    icon: Calendar,
    color: 'text-muted-foreground',
  },
};

export default function ErrorDrilldownModal({ isOpen, onClose, category, data = [] }) {
  const meta = CATEGORY_META[category] || {
    title: 'Pattern Deep-Dive',
    description: 'Analyze specific sessions to improve.',
    icon: Zap,
    color: 'text-primary',
  };

  const Icon = meta.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose} data-oid="g5.y52i">
      <DialogContent
        className="sm:max-w-[600px] bg-card/95 backdrop-blur-2xl border-border/50 p-0 overflow-hidden shadow-2xl"
        data-oid="ge0j9ye"
      >
        <DialogHeader className="p-6 pb-2" data-oid="easys69">
          <div className="flex items-center gap-4 mb-2" data-oid="3s593r0">
            <div
              className={cn('p-3 rounded-2xl bg-muted/50 border border-border/10', meta.color)}
              data-oid="1jx1t46"
            >
              <Icon className="w-6 h-6" data-oid="21gjf-z" />
            </div>
            <div data-oid="a0tg5bd">
              <DialogTitle
                className="text-2xl font-black tracking-tight text-foreground"
                data-oid="2.5pxub"
              >
                {meta.title}
              </DialogTitle>
              <DialogDescription
                className="text-sm font-medium text-muted-foreground/80 mt-1"
                data-oid="w8_0pzw"
              >
                {meta.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] px-6 pb-6" data-oid="vfovcl:">
          <div className="space-y-4 py-4" data-oid="ty.zi1e">
            {data.length > 0 ? (
              data.map((session, index) => {
                const TypeIcon = TYPE_ICONS[session.type.toLowerCase()] || BookOpen;
                const typeStyle = TYPE_COLORS[session.type.toLowerCase()] || '';
                const getReviewUrl = (s) => {
                  const typeMap = {
                    reading: 'reading-test',
                    listening: 'listening-test',
                    speaking: 'speaking-test',
                    writing: 'writing-task',
                  };
                  const path = typeMap[s.type.toLowerCase()] || 'reading-test';
                  return `/${path}/${s.id}?view-results=true`;
                };

                return (
                  <motion.div
                    key={`${session.id}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative p-4 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/50 hover:border-border transition-all"
                    data-oid="f7zwf_z"
                  >
                    <div className="flex items-start justify-between gap-4" data-oid="r:d_s.6">
                      <div className="flex gap-4" data-oid="s04o_z6">
                        <div
                          className={cn('p-2.5 rounded-xl border shrink-0', typeStyle)}
                          data-oid="luohsv3"
                        >
                          <TypeIcon className="w-5 h-5" data-oid="r9xxcu7" />
                        </div>
                        <div data-oid="k05xl4w">
                          <div className="flex items-center gap-2 mb-1" data-oid="h10pd-y">
                            <span
                              className="text-sm font-black text-foreground capitalize"
                              data-oid="gxws2y9"
                            >
                              {session.type}
                            </span>
                            <span
                              className="text-[10px] font-bold text-muted-foreground/60 uppercase"
                              data-oid="prinag3"
                            >
                              •{' '}
                              {new Date(session.date).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: '2-digit',
                              })}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mt-2" data-oid="sn-e-4-">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-black h-5 border-rose-500/20 text-rose-500 bg-rose-500/5"
                              data-oid="rw50hrh"
                            >
                              {session.count}{' '}
                              {category === 'rushed'
                                ? 'Rushed'
                                : category === 'overanalyzed'
                                  ? 'Overanalyzed'
                                  : category === 'nearMisses'
                                    ? 'Near Misses'
                                    : category === 'unanswered'
                                      ? 'Unanswered'
                                      : 'Issues'}
                            </Badge>
                            {(session.troubles || []).slice(0, 3).map((tt) => (
                              <Badge
                                key={tt}
                                variant="secondary"
                                className="text-[10px] font-bold h-5 bg-foreground/5 text-foreground/70 border-none"
                                data-oid="6467m8x"
                              >
                                {tt}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end" data-oid="0455na6">
                        <div className="text-lg font-black text-foreground" data-oid="glrrto2">
                          {session.score || '—'}
                        </div>
                        <div
                          className="text-[9px] font-black text-muted-foreground uppercase leading-none mt-1"
                          data-oid="o_m7tfo"
                        >
                          Band Score
                        </div>

                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="mt-4 h-8 px-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-[10px] font-bold group"
                          data-oid="-b:ae28"
                        >
                          <Link to={getReviewUrl(session)} data-oid="m2w7x2u">
                            Review
                            <ChevronRight
                              className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform"
                              data-oid="zk146je"
                            />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="py-12 text-center" data-oid="a0qaywv">
                <p className="text-muted-foreground text-sm font-medium" data-oid="2yyg_2m">
                  No sessions found for this category.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
