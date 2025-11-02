import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  // FIX: Removed redundant 'public' keyword.
  state: State = {
    hasError: false,
    error: undefined,
  };

  // FIX: Removed redundant 'public' keyword.
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // FIX: Removed redundant 'public' keyword.
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  // FIX: Removed redundant 'public' keyword.
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-lg">
                <h1 className="text-2xl font-bold text-red-600 mb-2">Application Error</h1>
                <p className="text-slate-600 mb-4">
                    We're sorry, but something went wrong while loading the application. Please try refreshing the page.
                </p>
                {this.state.error && (
                    <details className="text-left bg-slate-100 p-3 rounded-md">
                        <summary className="cursor-pointer font-medium text-slate-700">Error Details</summary>
                        <pre className="mt-2 text-sm text-slate-500 whitespace-pre-wrap break-all">
                            {this.state.error.toString()}
                        </pre>
                    </details>
                )}
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
