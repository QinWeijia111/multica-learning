import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import mermaid from 'astro-mermaid';

export default defineConfig({
  site: 'https://qinweijia111.github.io',
  base: '/multica-learning',
  markdown: {
    // astro-mermaid emits a raw HTML container that the Astro 7 MDX pipeline
    // must reparse into JSX-compatible elements.
    processor: satteri({ features: { rawHtml: true } }),
  },
  integrations: [
    mermaid({
      autoTheme: false,
      enableLog: false,
      theme: 'base',
      mermaidConfig: {
        securityLevel: 'strict',
        htmlLabels: false,
        suppressErrorRendering: true,
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        themeVariables: {
          background: '#fbfcf8',
          primaryColor: '#e6efea',
          primaryTextColor: '#182320',
          primaryBorderColor: '#245e50',
          lineColor: '#66736e',
          secondaryColor: '#fff6ed',
          secondaryTextColor: '#182320',
          secondaryBorderColor: '#a94725',
          tertiaryColor: '#f5f5f0',
          tertiaryTextColor: '#182320',
          tertiaryBorderColor: '#aab3ad',
          noteBkgColor: '#fff6ed',
          noteTextColor: '#182320',
          noteBorderColor: '#a94725',
        },
      },
    }),
    mdx(),
    react(),
  ],
});
