// Public entrypoint for Fluent theme primitives.
// Consumers should prefer importing from this module rather than `@fluentui/react-components`.
export * from "./fluentTheme";
export * from "./primitives/index";

// Keep explicit exports for any primitives not included in the index barrel.
export * from "./primitives/Carousel";
