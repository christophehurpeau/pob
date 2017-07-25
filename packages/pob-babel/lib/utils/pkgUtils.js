exports.hasReact = pkg =>
  !!(
    (pkg.dependencies && pkg.dependencies.react) ||
    (pkg.peerDependencies && pkg.peerDependencies.react)
  );
