import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('NEXUS Engine Uncaught Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#060d17',
          color: '#f8fafc',
          padding: '40px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            backgroundColor: '#0b1726',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#f43f5e'
              }} />
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, letterSpacing: '1px', color: '#f43f5e' }}>
                NEXUS PLATFORM DIAGNOSTIC NOTICE
              </h2>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6 }}>
              A runtime rendering exception occurred. Details below:
            </p>
            <pre style={{
              backgroundColor: '#050b14',
              color: '#38bdf8',
              padding: '16px',
              borderRadius: '8px',
              overflowX: 'auto',
              fontSize: '12px',
              fontFamily: 'monospace',
              border: '1px solid rgba(56, 189, 248, 0.2)'
            }}>
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.errorInfo?.componentStack}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '16px',
                padding: '10px 20px',
                backgroundColor: '#38bdf8',
                color: '#060d17',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              RELOAD NEXUS ENGINE
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
