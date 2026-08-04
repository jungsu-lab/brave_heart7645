import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const baseSchema = {
	title: z.string(),
	description: z.string(),
	date: z.coerce.date(),
	tags: z.array(z.string()).default([]),
};

const blog = defineCollection({
	loader: glob({ pattern: '**/[^_]*.md', base: './src/content/blog' }),
	schema: z.object({
		...baseSchema,
		category: z.enum(['daily', 'study']).default('daily'),
		author: z.string(),
		readingTime: z.string(),
	}),
});

const projects = defineCollection({
	loader: glob({ pattern: '**/[^_]*.md', base: './src/content/projects' }),
	schema: z.object({
		...baseSchema,
		role: z.string(),
		status: z.enum(['Active', 'Complete', 'Study']),
		stack: z.array(z.string()),
	}),
});

const videos = defineCollection({
	loader: glob({ pattern: '**/[^_]*.md', base: './src/content/videos' }),
	schema: z.object({
		...baseSchema,
		platform: z.string(),
		videoUrl: z.string().url().optional(),
		duration: z.string(),
	}),
});

export const collections = { blog, projects, videos };
