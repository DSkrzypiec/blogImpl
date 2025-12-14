// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [],
  site: 'https://dskrzypiec.dev',
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "src/styles/global.css";`
        }
      }
    }
  }
});
