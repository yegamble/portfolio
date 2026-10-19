module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.name !== 'eslint-config-next') return pkg;

      // typescript-eslint still needs the TS 6 API. Keep this compatibility
      // package within ESLint so tsc and Next.js builds use TypeScript 7.
      // https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0
      const peerDependencies = { ...pkg.peerDependencies };
      const peerDependenciesMeta = { ...pkg.peerDependenciesMeta };
      delete peerDependencies.typescript;
      delete peerDependenciesMeta.typescript;

      return {
        ...pkg,
        dependencies: {
          ...pkg.dependencies,
          typescript: 'npm:@typescript/typescript6@^6.0.2',
        },
        peerDependencies,
        peerDependenciesMeta,
      };
    },
  },
};
