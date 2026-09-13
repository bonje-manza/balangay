import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Balangay ErrorBoundary caught error:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 mb-4 shadow-sm">
            <AlertCircle className="w-6 h-6" />
          </div>

          <h2 className="font-serif font-bold text-2xl text-[#111111] tracking-tight mb-2">
            Something went wrong
          </h2>

          <p className="text-sm text-stone-600 max-w-md mb-6 leading-relaxed">
            An unexpected error occurred while rendering this view. Your offline ledger data remains securely saved in your browser.
          </p>

          <Button
            type="button"
            variant="primary"
            size="md"
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={this.handleReset}
          >
            Reload View
          </Button>

          {this.state.error && (
            <details className="mt-8 text-left max-w-lg w-full bg-stone-100/70 border border-stone-200 rounded-xl p-3 text-xs font-mono text-stone-700">
              <summary className="cursor-pointer font-bold text-stone-800 select-none">
                Technical Details
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-all text-[11px] text-rose-800">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
