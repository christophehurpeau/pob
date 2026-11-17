const userInfoRegex = /\b([a-z][\d+.a-z-]*:\/\/)[^\s/@]+@/gi;

/**
 * Hides the user info of every url in a text (`https://token@host` becomes
 * `https://***@host`): remotes may embed credentials. For anything printed.
 */
export const redactUrls = (text: string): string =>
  text.replaceAll(userInfoRegex, "$1***@");
