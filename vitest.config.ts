import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    // @ts-ignore
    environmentMatchGlobs: [
      ['tests/unit/components/**', 'jsdom'],
    ],
    globals: true,
    setupFiles: ['dotenv/config', './tests/helpers/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['services/**/*.ts', 'lib/**/*.ts'],
    },
  },
});
