import React, { useState } from "react";
import { ModelContextClientSettingsForm } from "aihappey-components";

export default {
  title: "Forms/ModelContextClientSettingsForm",
  component: ModelContextClientSettingsForm,
};

const Wrapper = (props) => {
  const [value, setValue] = useState(
    props.value || {
      logLevel: "info",
      toolTimeoutMinutes: 5,
      resetTimeoutOnProgress: true,
    }
  );

  return React.createElement(ModelContextClientSettingsForm, {
    ...props,
    value,
    onChangeLogLevel: (level) => setValue((prev) => ({ ...prev, logLevel: level })),
    onChangeTimeout: (minutes, resetOnProgress) =>
      setValue((prev) => ({
        ...prev,
        toolTimeoutMinutes: minutes,
        resetTimeoutOnProgress: resetOnProgress,
      })),
    onToggleResetOnProgress: (enabled) =>
      setValue((prev) => ({ ...prev, resetTimeoutOnProgress: enabled })),
  });
};

export const Default = () => React.createElement(Wrapper, {});

/**
 * MIN TIMEOUT — slider lower bound
 */
export const MinTimeout = () =>
  React.createElement(Wrapper, {
    value: {
      logLevel: "info",
      toolTimeoutMinutes: 1,
      resetTimeoutOnProgress: true,
    },
  });

/**
 * MAX TIMEOUT — slider upper bound
 */
export const MaxTimeout = () =>
  React.createElement(Wrapper, {
    value: {
      logLevel: "warning",
      toolTimeoutMinutes: 15,
      resetTimeoutOnProgress: false,
    },
  });

export const ResetOnProgressOn = () =>
  React.createElement(Wrapper, {
    value: {
      logLevel: "debug",
      toolTimeoutMinutes: 10,
      resetTimeoutOnProgress: true,
    },
  });

export const ResetOnProgressOff = () =>
  React.createElement(Wrapper, {
    value: {
      logLevel: "debug",
      toolTimeoutMinutes: 10,
      resetTimeoutOnProgress: false,
    },
  });

/**
 * TRANSLATIONS — custom labels + friendly log level names + computed timeout label
 */
export const WithTranslations = () =>
  React.createElement(Wrapper, {
    value: {
      logLevel: "notice",
      toolTimeoutMinutes: 7,
      resetTimeoutOnProgress: true,
    },
    translations: {
      logLevelLabel: "Client log level",
      logLevelTitles: {
        debug: "Debug (most verbose)",
        info: "Info",
        notice: "Notice",
        warning: "Warning",
        error: "Error",
        critical: "Critical",
        alert: "Alert",
        emergency: "Emergency (least verbose)",
      },
      timeoutLabel: (minutes) => `Tool timeout: ${minutes} minute(s)`,
      resetTimeoutLabel: "Reset timeout when progress events are received",
    },
  });

/**
 * ALL LOG LEVELS — renders one form per log level so the entire surface is visible.
 */
export const AllLogLevels = () => {
  const logLevels = [
    "debug",
    "info",
    "notice",
    "warning",
    "error",
    "critical",
    "alert",
    "emergency",
  ];

  return React.createElement(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 18, maxWidth: 480 } },
    logLevels.map((logLevel) =>
      React.createElement(
        "div",
        { key: logLevel, style: { padding: 12, border: "1px solid #ddd", borderRadius: 8 } },
        React.createElement("div", { style: { fontWeight: 600, marginBottom: 8 } }, logLevel),
        React.createElement(Wrapper, {
          value: {
            logLevel,
            toolTimeoutMinutes: 5,
            resetTimeoutOnProgress: true,
          },
        })
      )
    )
  );
};

