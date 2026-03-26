import { ReactPlugin } from "@microsoft/applicationinsights-react-js";
import { ApplicationInsights } from "@microsoft/applicationinsights-web";

declare const __APPLICATIONINSIGHTS_CONNECTION_STRING__: string;

const connectionString = __APPLICATIONINSIGHTS_CONNECTION_STRING__;

export const reactPlugin = new ReactPlugin();

export const appInsights = connectionString
  ? new ApplicationInsights({
      config: {
        connectionString,
        extensions: [reactPlugin],
        enableAutoRouteTracking: false,
      },
    })
  : null;

appInsights?.loadAppInsights();

export function trackAppException(error: Error, componentStack?: string): void {
  if (!appInsights) {
    return;
  }

  appInsights.trackException({
    exception: error,
    properties: componentStack ? { componentStack } : undefined,
  });
}
