import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Brain,
  BookOpen,
  PenTool,
  Headphones,
  Mic,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Target,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateStudyRecommendations } from '@/utils/api';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from '@/entities';

const moduleIcons = {
  reading: BookOpen,
  writing: PenTool,
  listening: Headphones,
  speaking: Mic,
  general: Brain,
  assessment: Target,
};

const priorityColors = {
  high: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  medium:
    'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
  low: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
};

const insightIcons = {
  weakness: AlertTriangle,
  strength: CheckCircle,
  improvement: TrendingUp,
  decline: TrendingDown,
  info: Lightbulb,
};

export default function StudyRecommendations() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    if (authUser) {
      loadRecommendations(authUser);
    } else {
      setIsLoading(false);
    }
  }, [authUser, authLoading]);

  const loadRecommendations = async (userData) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await generateStudyRecommendations();

      let recs = [];
      let insightsArr = [];
      const r = data?.recommendations;

      if (Array.isArray(r)) {
        recs = r;
      } else if (typeof r === 'string') {
        // Try to parse JSON string returned by the function
        try {
          const parsed = JSON.parse(r);
          if (Array.isArray(parsed)) {
            recs = parsed;
          } else if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.recommendations)) recs = parsed.recommendations;
            if (Array.isArray(parsed.insights)) insightsArr = parsed.insights;
          }
        } catch {
          // Fallback: create a single generic recommendation from plain text
          if (r && r.trim()) {
            recs = [
              {
                module: 'general',
                title: 'AI Suggestion',
                description: r,
                priority: 'medium',
                estimatedTime: '10-20 min',
              },
            ];
          }
        }
      } else if (r && typeof r === 'object') {
        if (Array.isArray(r.recommendations)) recs = r.recommendations;
        if (Array.isArray(r.insights)) insightsArr = r.insights;
      }

      // If insights also exist at top-level, prefer them
      if (Array.isArray(data?.insights)) {
        insightsArr = data.insights;
      }

      setRecommendations(recs);
      setInsights(insightsArr);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setError('Failed to load AI recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const getModuleUrl = (module) => {
    const moduleUrls = {
      reading: createPageUrl('Reading'),
      writing: createPageUrl('Writing'),
      listening: createPageUrl('Listening'),
      speaking: createPageUrl('Speaking'),
      general: createPageUrl('Dashboard'),
      assessment: createPageUrl('Reading'), // Default to reading for assessment
    };
    return moduleUrls[module] || createPageUrl('Dashboard');
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-oid="o9v0_x8">
        <Card className="bg-card border-border" data-oid="q-3liea">
          <CardHeader data-oid="e90dvyy">
            <CardTitle className="flex items-center gap-2" data-oid="fr4u.ge">
              <Brain className="w-5 h-5 text-primary animate-pulse" data-oid="ll6yv6n" />
              AI Study Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent data-oid="04g_99h">
            <div className="flex items-center justify-center py-8" data-oid="71b5kc8">
              <div className="flex items-center gap-3" data-oid="ftuxum5">
                <div
                  className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"
                  data-oid="5kccly8"
                ></div>
                <span className="text-muted-foreground" data-oid="l5io57r">
                  Your AI tutor is analyzing your performance...
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border-border" data-oid="jid1wdh">
        <CardContent className="pt-6" data-oid="x1jt.ge">
          <div className="text-center py-4" data-oid="82apzcm">
            <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" data-oid="6z6-hc0" />
            <p className="text-muted-foreground" data-oid="5cjg61v">
              {error}
            </p>
            <Button
              onClick={loadRecommendations}
              variant="outline"
              size="sm"
              className="mt-2"
              data-oid="04qjf-o"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-oid="59yel:p">
      {/* Study Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        data-oid="ttd:t3s"
      >
        <Card className="bg-card border-border shadow-lg" data-oid="3oo1lyy">
          <CardHeader data-oid="3apz9qu">
            <CardTitle className="flex items-center gap-2 text-foreground" data-oid="iisq62t">
              <Brain className="w-5 h-5 text-primary" data-oid="g0xlz0f" />
              AI Study Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4" data-oid="3-lp5m3">
            <AnimatePresence data-oid=".ehjlo0">
              {recommendations.map((rec, index) => {
                const ModuleIcon = moduleIcons[rec.module] || BookOpen;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="group"
                    data-oid="o58k541"
                  >
                    <Card
                      className="bg-muted/30 border-border hover:shadow-md transition-all duration-200"
                      data-oid="8uyyaqg"
                    >
                      <CardContent className="p-4" data-oid="emc3mlo">
                        <div className="flex items-start gap-4" data-oid="bru2mif">
                          <div
                            className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors"
                            data-oid="az-3cu5"
                          >
                            <ModuleIcon className="w-6 h-6 text-primary" data-oid="kr1b6uc" />
                          </div>
                          <div className="flex-1 min-w-0" data-oid="9zf4l-e">
                            <div
                              className="flex items-start justify-between mb-2"
                              data-oid="hs-vj55"
                            >
                              <h4
                                className="font-semibold text-foreground group-hover:text-primary transition-colors"
                                data-oid="nb9wv.p"
                              >
                                {rec.title}
                              </h4>
                              <div className="flex items-center gap-2 shrink-0" data-oid="7zoko71">
                                <Badge
                                  className={`text-xs px-2 py-1 ${priorityColors[rec.priority]}`}
                                  data-oid="hgmsybb"
                                >
                                  {rec.priority} priority
                                </Badge>
                                <div
                                  className="flex items-center gap-1 text-xs text-muted-foreground"
                                  data-oid=".dzby48"
                                >
                                  <Clock className="w-3 h-3" data-oid="t_qc9b5" />
                                  {rec.estimatedTime}
                                </div>
                              </div>
                            </div>
                            <p
                              className="text-sm text-muted-foreground mb-3 leading-relaxed"
                              data-oid="pnvawjw"
                            >
                              {rec.description}
                            </p>
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="hover:bg-primary hover:text-white transition-colors"
                              data-oid="3mzheqh"
                            >
                              <Link
                                to={getModuleUrl(rec.module)}
                                className="flex items-center gap-2"
                                data-oid="y6z1faz"
                              >
                                Start Practice
                                <ArrowRight className="w-3 h-3" data-oid="uvmizag" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {recommendations.length === 0 && (
              <div className="text-center py-8" data-oid="c0-azxr">
                <Target
                  className="w-12 h-12 text-muted-foreground mx-auto mb-4"
                  data-oid="8t7bmq2"
                />

                <p className="text-muted-foreground" data-oid=":a18:mp">
                  Complete more tests to get personalized recommendations
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          data-oid="hj-0hw6"
        >
          <Card className="bg-card border-border shadow-lg" data-oid="npz:1s:">
            <CardHeader data-oid="vf78b:7">
              <CardTitle className="flex items-center gap-2 text-foreground" data-oid="jqqmw6n">
                <Lightbulb className="w-5 h-5 text-amber-500" data-oid="_16fyd6" />
                AI Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3" data-oid="8ziulwt">
              {insights.map((insight, index) => {
                const InsightIcon = insightIcons[insight.type] || Lightbulb;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/50"
                    data-oid="pemh:9m"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        insight.type === 'weakness'
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : insight.type === 'strength'
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : insight.type === 'improvement'
                              ? 'bg-blue-100 dark:bg-blue-900/30'
                              : 'bg-amber-100 dark:bg-amber-900/30'
                      }`}
                      data-oid="kx7g:dt"
                    >
                      <InsightIcon
                        className={`w-4 h-4 ${
                          insight.type === 'weakness'
                            ? 'text-red-600 dark:text-red-400'
                            : insight.type === 'strength'
                              ? 'text-green-600 dark:text-green-400'
                              : insight.type === 'improvement'
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-amber-600 dark:text-amber-400'
                        }`}
                        data-oid="-6cys6g"
                      />
                    </div>
                    <div className="flex-1" data-oid="wkuxomr">
                      <h5 className="font-medium text-foreground mb-1" data-oid="hc0qupa">
                        {insight.title}
                      </h5>
                      <p className="text-sm text-muted-foreground" data-oid="6b7pzhp">
                        {insight.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
