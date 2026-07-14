import React, { Component, ErrorInfo, ReactNode } from "react";
import { trackAppException } from "./appInsights";

type AppInsightsErrorBoundaryProps = {
    children: ReactNode;
};

type AppInsightsErrorBoundaryState = {
    hasError: boolean;
};

class AppInsightsErrorBoundary extends Component<
    AppInsightsErrorBoundaryProps,
    AppInsightsErrorBoundaryState
> {
    state: AppInsightsErrorBoundaryState = {
        hasError: false,
    };

    static getDerivedStateFromError(): AppInsightsErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        trackAppException(error, errorInfo.componentStack ?? "No stacktrace");
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return null;
        }

        return this.props.children;
    }
}

export default AppInsightsErrorBoundary;
