import { defineConfig } from 'vite';
import htmlMinifier from 'vite-plugin-html-minifier';

export default defineConfig({
  plugins: [
    htmlMinifier({ minify: true }),
  ],
});
