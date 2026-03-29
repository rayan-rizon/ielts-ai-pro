import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ChevronRight, Clock, Users, ArrowRight, ChevronDown } from 'lucide-react';
import { cn, formatTestTitle } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createPageUrl } from '@/utils';

const CambridgeTestsCard = React.memo(({ cambridgeTests = [], user }) => {
  const isPro = user?.subscription_tier === 'pro' || user?.subscription_tier === 'premium';
  const [expanded, setExpanded] = useState(true);

  if (!cambridgeTests?.length && !isPro) {
    // We already handle the "Locked" state in the main render,
    // but if for some reason we want to hide it completely when empty for non-pros,
    // we could keep a return null. However, the current code has a "Locked" UI
    // that should be shown to non-pros even if tests are empty (or failed to fetch).
  }
  return (
    <Card
      className={cn(
        'rounded-2xl transition-all duration-300 overflow-hidden group flex flex-col h-full',
        'bg-white/60 dark:bg-slate-900/50 backdrop-blur-2xl',
        'border border-white/60 dark:border-white/[0.12]',
        'shadow-[0_10px_40px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]',
        'hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.2)] dark:hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.6)]',
        'hover:border-indigo-500/40 dark:hover:border-indigo-500/40'
      )}
      data-oid="d2101jw"
    >
      <CardHeader className="p-4 md:p-5 pb-0" data-oid="8d6d:g9">
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          data-oid="nqm2hqv"
        >
          <CardTitle
            className="text-base md:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2.5"
            data-oid="zbho-ei"
          >
            <div
              className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-500/20 transition-transform group-hover:rotate-12"
              data-oid="aghf1ol"
            >
              <ShieldCheck
                className="w-4 h-4 transition-transform duration-500 group-hover:scale-110"
                data-oid="1ez4dm."
              />
            </div>
            <div data-oid="tw69a0b">
              <span className="tracking-tight" data-oid="6z10roy">
                Official Cambridge Tests
              </span>
              <p
                className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none mt-0.5"
                data-oid="k0-ep78"
              >
                Authentic Practice Material
              </p>
            </div>
          </CardTitle>
          <div
            className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end"
            data-oid="cgr_7w5"
          >
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden md:flex h-7 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              data-oid="jmi1qmq"
            >
              <Link to={createPageUrl('Reading')} data-oid="-qf90xx">
                Archives <ChevronRight className="w-3 h-3 ml-0.5" data-oid="u0tqb9p" />
              </Link>
            </Button>
            <motion.button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2.5 py-1.5 rounded-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/5 w-full sm:w-auto justify-center"
              data-oid="f:bfouq"
            >
              {expanded ? 'Collapse' : 'Expand'}
              <ChevronDown
                className={cn(
                  'w-2.5 h-2.5 transition-transform duration-300',
                  expanded && 'rotate-180'
                )}
                data-oid="oibc.yg"
              />
            </motion.button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 md:p-5 pt-3" data-oid="62mepw:">
        <AnimatePresence initial={false} data-oid="44vsl.g">
          {expanded && (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'linear' }}
              className="overflow-hidden"
              data-oid="cdb9ruh"
            >
              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-2"
                data-oid="i74xpr2"
              >
                {cambridgeTests.map((test, idx) => (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08, type: 'spring', damping: 20 }}
                    whileHover={{ y: -6 }}
                    className="group/item"
                    data-oid="i5ro-ju"
                  >
                    <Link
                      to={`/reading-test?test-id=${test.id}`}
                      className="block h-full"
                      data-oid="y_y55ae"
                    >
                      <div
                        className={cn(
                          'relative overflow-hidden h-full rounded-2xl transition-all duration-300',
                          'bg-white/60 dark:bg-slate-900/50 backdrop-blur-md',
                          'border border-slate-200/70 dark:border-white/10',
                          'shadow-sm',
                          'hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.2)] dark:hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.6)]',
                          'hover:border-indigo-500/40 dark:hover:border-indigo-500/40'
                        )}
                        data-oid="5dk-ed4"
                      >
                        {/* Decorative Gradient & Pattern */}
                        <div
                          className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full -mr-20 -mt-20 group-hover/item:scale-125 transition-transform duration-700"
                          data-oid="wuwlf25"
                        />

                        <div
                          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"
                          data-oid=".uoktay"
                        />

                        <div
                          className="p-3 sm:p-4 relative z-10 flex items-center justify-between gap-2 sm:gap-4"
                          data-oid=".drbj0-"
                        >
                          <div
                            className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1"
                            data-oid="4o6kyu_"
                          >
                            <div
                              className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-500/10 dark:to-slate-900 border border-indigo-100 dark:border-white/10 flex flex-col items-center justify-center shrink-0 shadow-lg transition-all duration-300 group-hover/item:scale-105 group-hover/item:shadow-indigo-500/20"
                              data-oid="m38p44o"
                            >
                              <span
                                className="text-[7px] sm:text-[9px] font-black text-indigo-600 dark:text-indigo-400 leading-none mb-0.5 sm:mb-1"
                                data-oid="h9.vler"
                              >
                                VOL
                              </span>
                              <span
                                className="text-sm sm:text-xl font-black text-slate-900 dark:text-white group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors"
                                data-oid="zun_whd"
                              >
                                {test.cambridge_book_number ||
                                  (test.cambridge_year ? test.cambridge_year - 2005 : null) ||
                                  test.title.match(/\d+/)?.[0] ||
                                  idx + 1}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1" data-oid="un0khfu">
                              <div
                                className="flex items-center gap-2 mb-0.5 sm:mb-1"
                                data-oid="zbf4lj2"
                              >
                                <Badge
                                  className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-0 text-[6px] sm:text-[8px] font-black px-1.5 py-0 sm:py-0.5 rounded-md uppercase tracking-tight shadow-lg shadow-indigo-500/25"
                                  data-oid="8-zq1:8"
                                >
                                  OFFICIAL
                                </Badge>
                                <span
                                  className="text-[8px] sm:text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight truncate hidden sm:inline-block"
                                  data-oid="ilhcv.1"
                                >
                                  IELTS SERIES
                                </span>
                              </div>
                              <h4
                                className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white line-clamp-1 group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors leading-tight"
                                data-oid="-a3pu5g"
                              >
                                {formatTestTitle(test)}
                              </h4>
                              <div
                                className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 mt-0.5 sm:mt-2"
                                data-oid="nhag8y6"
                              >
                                <div
                                  className="flex items-center gap-1 text-slate-600 dark:text-slate-400"
                                  data-oid="zs80av2"
                                >
                                  <Clock
                                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-500"
                                    data-oid="s3l2oxd"
                                  />

                                  <span
                                    className="text-[9px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300"
                                    data-oid="7b3dssd"
                                  >
                                    60m
                                  </span>
                                </div>
                                <div
                                  className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-slate-300 dark:bg-slate-700"
                                  data-oid="vox4xqu"
                                />

                                <div
                                  className="flex items-center gap-1 text-slate-600 dark:text-slate-400"
                                  data-oid="j:wt.-v"
                                >
                                  <Users
                                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-500"
                                    data-oid="sz0zmr7"
                                  />

                                  <span
                                    className="text-[9px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300"
                                    data-oid=":kevg7g"
                                  >
                                    2.4k
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0" data-oid="1cim5uu">
                            <div
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 border-0 flex items-center justify-center text-white shadow-lg transition-all duration-300 group-hover/item:scale-110 group-hover/item:shadow-indigo-500/30 transform group-hover/item:translate-x-1"
                              data-oid="_9:3z-0"
                            >
                              <ArrowRight
                                className="w-3.5 h-3.5 sm:w-5 sm:h-5"
                                data-oid="icxo22t"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}

                {!cambridgeTests?.length && (
                  <div
                    className="col-span-full py-12 flex flex-col items-center justify-center text-center"
                    data-oid="h-vweab"
                  >
                    <div
                      className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-500/20"
                      data-oid="hoju-qc"
                    >
                      <ShieldCheck className="w-8 h-8 text-indigo-500" data-oid="rdii92d" />
                    </div>
                    <h4
                      className="text-xl font-black text-slate-900 dark:text-white mb-2"
                      data-oid="fuju5n:"
                    >
                      No Official Tests Found
                    </h4>
                    <p
                      className="text-sm font-semibold text-slate-500 dark:text-slate-400 max-w-sm"
                      data-oid="ldveysa"
                    >
                      We're currently updating our official Cambridge library. Please check back
                      later for authentic practice material.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
});

CambridgeTestsCard.displayName = 'CambridgeTestsCard';

export default CambridgeTestsCard;
