module.exports = {
  root: true,
  extends: ['next/core-web-vitals'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    // Disable rules that are causing the most issues
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-unsafe-function-type': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    'import/no-anonymous-default-export': 'off',
    
    // Re-enable these rules later as warnings
    // '@typescript-eslint/no-explicit-any': 'warn',
    // '@typescript-eslint/no-unused-vars': 'warn',
  },
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'dist/',
    'public/',
    '**/*.d.ts',
  ],
};
