import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in idchug:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0c0e15] text-gray-200 p-6 text-center select-none font-sans">
          <div className="bg-[#161a26] border border-red-500/50 rounded-2xl p-8 max-w-lg shadow-2xl shadow-red-950/50">
            <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-500/60 flex items-center justify-center mx-auto mb-4 text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">レンダリングエラーが発生しました</h2>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              画面の描画中に予期せぬエラーが発生しました。
            </p>
            <div className="bg-[#0e1118] border border-gray-800 rounded-lg p-3 text-left font-mono text-[11px] text-red-400 max-h-32 overflow-auto mb-6">
              {this.state.error?.message || 'Unknown error'}
            </div>
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-lg shadow-lg shadow-red-900/60 transition flex items-center justify-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>ページを再読み込み</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

