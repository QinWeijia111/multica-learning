import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://qinweijia111.github.io',
  base: '/multica-learning',
  integrations: [mdx(), react()],
});
