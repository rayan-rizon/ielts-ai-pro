import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';

const LockedContent = ({ resource }) => (
  <div className="p-8 sm:p-10 text-center space-y-6 max-w-lg mx-auto" data-oid="eg00wqs">
    <div
      className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto ring-8 ring-indigo-500/5"
      data-oid="zjcbk-c"
    >
      <Lock className="w-8 h-8 text-indigo-500" data-oid="b4ux9gm" />
    </div>
    <div className="space-y-2" data-oid="lv6dcn.">
      <h2
        className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight"
        data-oid="ar26jf."
      >
        Premium Content
      </h2>
      <p
        className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed max-w-[280px] mx-auto"
        data-oid="5k46c88"
      >
        This {resource.access_tier} vocabulary list is locked. Upgrade your plan to access this and{' '}
        {resource.access_tier === 'pro' ? 'hundreds' : 'thousands'} of other curated materials.
      </p>
    </div>
    <Button
      onClick={() => (window.location.href = '/pricing')}
      className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all text-xs"
      data-oid="t8.uvue"
    >
      View Pricing Plans
    </Button>
  </div>
);

const WordCard = ({ item, index, isAdded, isAdding, onAdd }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.03 }}
    className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm group hover:shadow-md transition-all duration-300 relative"
    data-oid="ofv2gmw"
  >
    <div
      className="flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-8"
      data-oid="_88eofd"
    >
      {/* Word & Definition */}
      <div className="space-y-1.5 md:w-5/12 flex-shrink-0" data-oid="atlde:s">
        <h4 className="text-xl font-bold text-indigo-600 dark:text-indigo-400" data-oid="4l9ycln">
          {item.word}
        </h4>
        <p
          className="text-[14px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed"
          data-oid="yog-thg"
        >
          {item.definition}
        </p>
      </div>

      {/* Divider */}
      <div
        className="md:w-[2px] md:h-12 bg-slate-100 dark:bg-white/10 hidden md:block rounded-full"
        data-oid="0jx.ygt"
      />

      {/* Example Sentence */}
      <div className="flex-1 md:w-5/12" data-oid="blsw1v7">
        <p
          className="text-[13px] text-slate-500 dark:text-slate-400 italic leading-relaxed"
          data-oid="-euq59w"
        >
          &quot;{item.example}&quot;
        </p>
      </div>

      {/* Action Button */}
      <div className="md:w-1/12 flex justify-end mt-4 md:mt-0">
        <Button
          variant="ghost"
          size="icon"
          disabled={isAdded || isAdding}
          onClick={onAdd}
          className={cn(
            'h-10 w-10 shrink-0 rounded-full transition-all duration-300',
            isAdded
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 opacity-100'
              : 'hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 text-slate-400'
          )}
          title={isAdded ? 'Already in your library' : 'Add to my library'}
        >
          {isAdded ? (
            <Check className="w-5 h-5" />
          ) : isAdding ? (
            <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-indigo-600 animate-spin" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  </motion.div>
);

const StudyHeader = ({ resource }) => (
  <div
    className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md p-6 border-b border-slate-100 dark:border-white/5"
    data-oid="smfe2e:"
  >
    <div className="flex justify-between items-start gap-6" data-oid="gn1hpje">
      <div className="space-y-1" data-oid="s79si9e">
        <Badge
          className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-2"
          data-oid="bxwb_l4"
        >
          IELTS Vocabulary List
        </Badge>
        <h2
          className="text-2xl font-black text-slate-900 dark:text-white italic"
          data-oid="7ork.gw"
        >
          {resource.title}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-xs" data-oid="xrt14_x">
          {resource.description}
        </p>
      </div>
    </div>
  </div>
);

const WordList = ({ words, allVocabulary, onAddWord }) => {
  const [addingWords, setAddingWords] = useState(new Set());

  return (
    <div className="p-6 md:p-8 space-y-4" data-oid="qo992m5">
      {words.map((item, i) => {
        const isAdded = allVocabulary?.some(
          (v) => v?.word?.toLowerCase() === item?.word?.toLowerCase()
        );
        const isAdding = addingWords.has(item.word);

        const handleAdd = async (e) => {
          e.stopPropagation();
          if (isAdded || isAdding) return;
          setAddingWords((prev) => new Set(prev).add(item.word));
          await onAddWord({
            word: item.word,
            definition: item.definition,
            example: item.example,
          });
        };

        return (
          <WordCard
            key={i}
            index={i}
            item={item}
            isAdded={isAdded}
            isAdding={isAdding}
            onAdd={handleAdd}
          />
        );
      })}
    </div>
  );
};

export default function VocabularyStudyView({
  resource,
  user,
  onClose: _onClose,
  onAddWord,
  allVocabulary,
}) {
  const words = JSON.parse(resource.content || '[]');

  const hasAccess = () => {
    if (resource.access_tier === 'free') return true;
    if (!user) return false;
    const tiers = { free: 0, pro: 1, premium: 2 };
    return tiers[user.subscription_tier || 'free'] >= tiers[resource.access_tier];
  };

  if (!hasAccess()) {
    return <LockedContent resource={resource} />;
  }

  return (
    <div className="relative" data-oid="qb8im7q">
      <StudyHeader resource={resource} />
      <WordList words={words} allVocabulary={allVocabulary} onAddWord={onAddWord} />
    </div>
  );
}
