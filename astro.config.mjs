// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [],
  site: 'https://dskrzypiec.dev',
  i18n: {
    locales: ['en', 'pl'],
    defaultLocale: 'en',
    routing: {
      // English is served at "/", Polish under "/pl/".
      prefixDefaultLocale: false,
    },
  },
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
