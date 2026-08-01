import React from 'react';
import { AlertCircle, ArrowLeft, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function SpeakingReportErrorState({ evaluationError, onRetryEvaluation }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-rose-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50">Analysis Failed</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto">
          We encountered an error while processing your speaking test. {evaluationError}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onRetryEvaluation}
          size="lg"
          className="bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-500/20 rounded-2xl h-14 px-8 font-bold flex items-center gap-2 order-1 sm:order-2"
        >
          <RefreshCw className="w-5 h-5" />
          Try Again
        </Button>
        <div className="flex gap-2 order-2 sm:order-1">
          <Button
            variant="outline"
            asChild
            className="h-14 px-6 rounded-2xl font-bold border-2 hover:bg-[#f4f3fb] dark:hover:bg-white/[0.06]"
          >
            <Link to="/speaking">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tests
            </Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="h-14 px-6 rounded-2xl font-bold border-2 hover:bg-[#f4f3fb] dark:hover:bg-white/[0.06]"
          >
            <Link to="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
