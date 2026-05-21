import React from 'react';

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
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-100"
          data-oid="lr3o54p"
        >
          <h4 className="mb-1 font-medium" data-oid="bdyf04y">
            {this.props.title || 'Something went wrong'}
          </h4>
          <p className="mb-3 text-sm text-amber-700 dark:text-amber-300" data-oid="qdvuz2z">
            {this.props.fallbackMessage || 'This section could not be displayed. Please try again.'}
          </p>

          {import.meta.env.DEV && this.state.error && (
            <details className="mb-3" data-oid="p__:4og">
              <summary className="cursor-pointer text-xs text-amber-600" data-oid="sbj4ws-">
                Technical details
              </summary>
              <pre
                className="mt-2 max-h-32 overflow-auto rounded bg-amber-100 p-2 text-xs text-amber-900 dark:bg-amber-900/30 dark:text-amber-100"
                data-oid="ir7jud4"
              >
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <button
            type="button"
            onClick={this.handleRetry}
            className="rounded-md border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/50"
            data-oid="_3yh4zk"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
