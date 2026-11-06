import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  build: { target: 'es2022', rolldownOptions: { input: ['index.html', 'haunt.html'] } },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
