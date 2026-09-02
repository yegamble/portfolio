import nextConfig from 'eslint-config-next';
import prettier from 'eslint-config-prettier';

const eslintConfig = [
  ...nextConfig,
  prettier,
  {
    ignores: [
      '.next/',
      '.open-next/',
      'out/',
      'build/',
      'coverage/',
      'test-results/',
      'playwright-report/',
    ],
  },
];

export default eslintConfig;
