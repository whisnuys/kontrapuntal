import { getCollection, type CollectionEntry } from 'astro:content';

import {
  isDiscoverable,
  isRoutable,
  sortNotesNewest,
  type NoteSummary,
} from './content-policy.ts';

export type NoteEntry = CollectionEntry<'notes'>;
export type LibraryEntry = CollectionEntry<'library'>;

export async function getAuthorNames(): Promise<Map<string, string>> {
  const authors = await getCollection('authors');
  return new Map(authors.map((author) => [author.id, author.data.name]));
}

export async function getTopicNames(): Promise<Map<string, string>> {
  const topics = await getCollection('topics');
  return new Map(topics.map((topic) => [topic.id, topic.data.name]));
}

export async function getFormatNames(): Promise<Map<string, string>> {
  const formats = await getCollection('formats');
  return new Map(formats.map((format) => [format.id, format.data.name]));
}

export function toNoteSummary(entry: NoteEntry): NoteSummary {
  return {
    id: entry.id,
    title: entry.data.title,
    description: entry.data.description,
    publishedAt: entry.data.publishedAt,
    updatedAt: entry.data.updatedAt,
    status: entry.data.status,
    format: entry.data.format,
    topics: entry.data.topics,
    featured: entry.data.featured,
    source: entry.data.source,
  };
}

export async function getAllNotes(): Promise<NoteEntry[]> {
  return getCollection('notes');
}

export async function getDiscoverableNotes(): Promise<NoteEntry[]> {
  const notes = await getAllNotes();
  const order = new Map(
    sortNotesNewest(notes.map(toNoteSummary)).map((note, index) => [note.id, index]),
  );

  return notes
    .filter((entry) => isDiscoverable(toNoteSummary(entry)))
    .sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0));
}

export async function getRoutableNotes(): Promise<NoteEntry[]> {
  const notes = await getAllNotes();
  return notes.filter((entry) => isRoutable(toNoteSummary(entry)));
}

export async function getLibraryEntries(): Promise<LibraryEntry[]> {
  return getCollection('library');
}
