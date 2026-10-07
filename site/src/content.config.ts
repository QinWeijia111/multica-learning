import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const tutorials = defineCollection({
  loader: glob({ base: './src/content/tutorials', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    slug: z.string(),
    module: z.string(),
    title: z.string(),
    description: z.string(),
    order: z.number().int().nonnegative(),
    group: z.string().optional(),
    upstreamRepository: z.string(),
    upstreamCommit: z.string().regex(/^[0-9a-f]{40}$/),
    researchArtifact: z.string(),
  }),
});

export const collections = { tutorials };
