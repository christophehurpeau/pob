export const appIgnorePaths = {
  alp: (config) => ['# alp paths', '/build', '/public', '/data'],
  'next.js': (config) => [
    '# next.js paths',
    '/.next',
    '/out',
    '/build',
    '/.env.local',
  ],
  remix: (config) => ['# remix paths', '/.cache', '/build', '/public/build'],
  pobpack: (config) => ['/build', '/public'],
  node: (config) => ['/build'],
  'node-library': (config) => ['/build'],
  'alp-node': (config) => ['/build'],
  other: (config) => [],
};
