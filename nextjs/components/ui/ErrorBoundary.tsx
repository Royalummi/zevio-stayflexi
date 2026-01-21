"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import styles from "./ErrorBoundary.module.css";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Industry-standard error handling for production applications
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error Boundary caught an error:", error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send error to logging service (e.g., Sentry, LogRocket)
    // this.logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorBoundaryContainer}>
            <div className={styles.errorBoundaryIcon}>
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h1 className={styles.errorBoundaryTitle}>
              Oops! Something went wrong
            </h1>

            <p className={styles.errorBoundaryMessage}>
              We&apos;re sorry for the inconvenience. The application
              encountered an unexpected error.
            </p>

            <div className={styles.errorBoundaryActions}>
              <button
                onClick={this.handleReset}
                className={`${styles.errorBoundaryButton} ${styles.errorBoundaryButtonPrimary}`}
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className={`${styles.errorBoundaryButton} ${styles.errorBoundaryButtonSecondary}`}
              >
                Reload Page
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className={`${styles.errorBoundaryButton} ${styles.errorBoundaryButtonGhost}`}
              >
                Go to Homepage
              </button>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className={styles.errorBoundaryDetails}>
                <summary className={styles.errorBoundaryDetailsSummary}>
                  Error Details (Development Only)
                </summary>
                <div className={styles.errorBoundaryDetailsContent}>
                  <p>
                    <strong>Error:</strong> {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className={styles.errorBoundaryStack}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
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
