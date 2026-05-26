'use client';

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-dark-surface px-8 text-center">
          <span className="text-3xl block mb-4 opacity-30">⚠</span>
          <h2 className="text-base font-bold text-white mb-2">Terjadi Kesalahan</h2>
          <p className="text-sm text-[#94A3B8] mb-4">{this.state.error.message}</p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            className="btn-primary text-sm"
          >
            Muat Ulang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
