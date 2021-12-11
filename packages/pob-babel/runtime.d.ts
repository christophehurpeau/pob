export {};

declare global {
  const __DEV__: boolean;
  const __POB_TARGET__: 'node' | 'browser';
  const __POB_TARGET_VERSION__: 'modern' | '14.17' | 'current' | undefined;
}
