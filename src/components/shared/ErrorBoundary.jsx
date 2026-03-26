import React from 'react';
import AlertTriangle from 'lucide-react/icons/alert-triangle';
import RefreshCw from 'lucide-react/icons/refresh-cw';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Reusable Error Boundary for catching and handling rendering errors.
 * Wrap around components that might fail to prevent full page crashes.
 *
 * @example
 * <ErrorBoundary fallbackMessage="Could not load question">
 *   <QuestionRenderer {...props} />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Log error for debugging (could be sent to logging service)
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo?.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Card
          className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20"
          data-oid="lr3o54p"
        >
          <CardContent className="p-4" data-oid="nyqe3g.">
            <div className="flex items-start gap-3" data-oid="dlf6fih">
              <div
                className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full"
                data-oid="vwwl835"
              >
                <AlertTriangle
                  className="w-5 h-5 text-amber-600 dark:text-amber-400"
                  data-oid="nngo1xh"
                />
              </div>
              <div className="flex-1 min-w-0" data-oid="74jy1m7">
                <h4
                  className="font-medium text-amber-800 dark:text-amber-200 mb-1"
                  data-oid="bdyf04y"
                >
                  {this.props.title || 'Something went wrong'}
                </h4>
                <p className="text-sm text-amber-600 dark:text-amber-400 mb-3" data-oid="qdvuz2z">
                  {this.props.fallbackMessage ||
                    'This section could not be displayed. Please try again.'}
                </p>

                {/* Show error details in development */}
                {import.meta.env.DEV && this.state.error && (
                  <details className="mb-3" data-oid="p__:4og">
                    <summary
                      className="text-xs text-amber-500 cursor-pointer hover:text-amber-700"
                      data-oid="sbj4ws-"
                    >
                      Technical details
                    </summary>
                    <pre
                      className="mt-2 p-2 bg-amber-100 dark:bg-amber-900/30 rounded text-xs overflow-auto max-h-32 text-amber-800 dark:text-amber-200"
                      data-oid="ir7jud4"
                    >
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleRetry}
                  className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                  data-oid="_3yh4zk"
                >
                  <RefreshCw className="w-3 h-3 mr-2" data-oid="er8._o2" />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
