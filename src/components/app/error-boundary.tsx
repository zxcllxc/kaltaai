"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** при смене ключа экран пытается отрисоваться заново */
  resetKey?: string;
  labels: { title: string; reload: string; restart: string };
  onRestart?: () => void;
}

/** Если на экране что-то упало — показываем понятную карточку, а не белый экран. */
export class ErrorBoundary extends Component<Props, { error: Error | null; key?: string }> {
  state = { error: null as Error | null, key: this.props.resetKey };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: { error: Error | null; key?: string }) {
    if (props.resetKey !== state.key) return { error: null, key: props.resetKey };
    return null;
  }

  componentDidCatch(error: Error) {
    console.warn("[KaltaAI] screen error:", error?.message);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const { labels, onRestart } = this.props;
    return (
      <div role="alert" className="rounded-xl border border-amber-500/40 bg-amber-400/10 p-4 space-y-3 text-sm">
        <div className="font-semibold">{labels.title}</div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-md border bg-background px-3 py-2" onClick={() => this.setState({ error: null })}>
            {labels.reload}
          </button>
          {onRestart && (
            <button className="rounded-md border bg-background px-3 py-2" onClick={onRestart}>
              {labels.restart}
            </button>
          )}
        </div>
      </div>
    );
  }
}
