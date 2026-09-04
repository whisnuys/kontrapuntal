import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

import { CONTENT_TYPES, NOTE_FORMATS, NOTE_STATUSES } from './lib/content-policy.ts';
import { isApprovedStringImageSource } from './lib/media-policy.ts';

const stringImageSource = z.string().refine(isApprovedStringImageSource, {
  message: 'Use a root-relative image path or a secure image URL from the configured Cloudinary account.',
});

const sourceSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  creator: z.string().min(1).optional(),
  url: z.url().optional(),
});

const authors = defineCollection({
  loader: glob({ base: './src/content/authors', pattern: '**/*.json' }),
  schema: z.object({
    name: z.string().min(1),
  }),
});

const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        description: z.string().min(1),
        authors: z.array(reference('authors')).min(1).max(4),
        publishedAt: z.coerce.date(),
        updatedAt: z.coerce.date().optional(),
        status: z.enum(NOTE_STATUSES),
        contentType: z.enum(CONTENT_TYPES),
        format: z.enum(NOTE_FORMATS),
        topics: z.array(z.string().min(1)).min(1),
        featured: z.boolean().default(false),
        heroImage: z.union([stringImageSource, image()]).optional(),
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
        cover: z.union([stringImageSource, image()]).optional(),
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

export const collections = { authors, notes, library };
