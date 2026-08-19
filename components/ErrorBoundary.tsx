"use client";

import { Component, type ReactNode } from "react";

type Props = {
  title: string;
  resetKey?: string;
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(previousProps: Props) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="m-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <h2 className="font-semibold">{this.props.title}</h2>
          <p className="mt-1 text-xs leading-5">This editor region could not render safely. Try selecting another element or resetting the editor.</p>
        </section>
      );
    }

    return this.props.children;
  }
}
