import React from 'react';
import { AlertOctagon } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] max-w-md w-full font-space text-center">
            <AlertOctagon size={48} className="mx-auto mb-4 text-red-600" />
            <h1 className="font-inter font-black text-2xl uppercase tracking-tighter mb-4 text-black">
              SYSTEM MALFUNCTION
            </h1>
            <p className="text-xs text-neutral-600 uppercase leading-relaxed mb-6">
              AN UNEXPECTED ERROR HAS OCCURRED. OUR TEAM HAS BEEN NOTIFIED.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-black text-white px-6 py-4 font-bold uppercase text-xs tracking-widest hover:bg-neutral-800 transition-colors"
            >
              RETURN TO BASE
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
