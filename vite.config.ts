/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => ({
  // Dev stays at /. Preview and production match GitHub Pages.
  base: command === 'serve' && mode !== 'production' ? '/' : '/palette-pick/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
}));
