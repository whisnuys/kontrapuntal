import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

import { CONTENT_TYPES, NOTE_FORMATS, NOTE_STATUSES } from './lib/content-policy.ts';

const sourceSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  creator: z.string().min(1).optional(),
  url: z.url().optional(),
});

const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        description: z.string().min(1),
        publishedAt: z.coerce.date(),
        updatedAt: z.coerce.date().optional(),
        status: z.enum(NOTE_STATUSES),
        contentType: z.enum(CONTENT_TYPES),
        format: z.enum(NOTE_FORMATS),
        topics: z.array(z.string().min(1)).min(1),
        featured: z.boolean().default(false),
        heroImage: z.union([z.string().startsWith('/'), image()]).optional(),
        heroAlt: z.string().min(1).optional(),
        source: sourceSchema.optional(),
        writingFocus: z.string().optional(),
        newWords: z.array(z.string()).optional(),
        commonMistakes: z.array(z.string()).optional(),
        draftNotes: z.string().optional(),
      })
      .superRefine((data, context) => {
        if (data.heroImage && !data.heroAlt) {
          context.addIssue({
            code: 'custom',
            message: 'heroAlt is required when heroImage is set.',
            path: ['heroAlt'],
          });
        }
      }),
});

const library = defineCollection({
  loader: glob({ base: './src/content/library', pattern: '**/*.json' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        type: z.enum(['book', 'game', 'video', 'podcast', 'article']),
        status: z.enum(['current', 'finished', 'paused', 'dropped', 'want-to-consume']),
        creator: z.string().min(1).optional(),
        startedAt: z.coerce.date().optional(),
        finishedAt: z.coerce.date().optional(),
        cover: z.union([z.string().startsWith('/'), image()]).optional(),
        coverAlt: z.string().min(1).optional(),
        externalUrl: z.url().optional(),
        relatedNotes: z.array(reference('notes')).default([]),
        annotation: z.string().optional(),
        privateNotes: z.string().optional(),
      })
      .superRefine((data, context) => {
        if (data.cover && !data.coverAlt) {
          context.addIssue({
            code: 'custom',
            message: 'coverAlt is required when cover is set.',
            path: ['coverAlt'],
          });
        }
      }),
});

export const collections = { notes, library };
