// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://kontrapuntal.whisnuys.com',
  output: 'static',
  integrations: [mdx()],
  devToolbar: {
    enabled: false
  }
});
