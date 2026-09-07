import { Component } from 'react';

// Without this, any uncaught render error unmounts the whole tree and leaves
// a blank white screen with no indication anything went wrong.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--color-gray-400)', fontFamily: 'var(--font-heading)' }}>
            Something went wrong.
          </p>
          {import.meta.env.DEV && (
            <pre style={{ fontSize: 12, color: 'var(--color-gray-400)', whiteSpace: 'pre-wrap', textAlign: 'left', maxWidth: '100%', overflow: 'auto' }}>
              {this.state.error.message}
            </pre>
          )}
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
