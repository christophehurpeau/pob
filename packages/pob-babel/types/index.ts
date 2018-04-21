export {}

declare global {
  const POB_ENV: 'production' | 'development';
  const POB_TARGET: 'node' | 'browser';
  const POB_TARGET_VERSION: undefined | string;
}
