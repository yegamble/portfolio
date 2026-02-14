import nextConfig from 'eslint-config-next';
import prettier from 'eslint-config-prettier';

const eslintConfig = [
  ...nextConfig,
  prettier,
  {
    ignores: ['.next/', 'out/', 'build/'],
  },
];

export default eslintConfig;
