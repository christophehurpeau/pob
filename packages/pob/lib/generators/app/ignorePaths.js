export const appIgnorePaths = {
  alp: (config) => ['# alp paths', '/build', '/public', '/data'],
  'next.js': (config) => ['# next.js paths', '/.next', '/out', '/build'],
  pobpack: (config) => ['/build', '/public'],
  node: (config) => ['/dist'],
  other: (config) => [],
};
