import { Component, type ReactNode } from 'react';

interface Props {
    fallback: ReactNode;
    children: ReactNode;
}

interface State {
    failed: boolean;
}

// A crashing background shows the fallback instead of taking the whole page down with it
class BackgroundErrorBoundary extends Component<Props, State> {
    state: State = { failed: false };

    static getDerivedStateFromError(): State {
        return { failed: true };
    }

    render() {
        return this.state.failed ? this.props.fallback : this.props.children;
    }
}

export default BackgroundErrorBoundary;
