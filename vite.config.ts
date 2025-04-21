import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  esbuild: {
    tsconfigRaw: require('../tsconfig.json'), 
});
