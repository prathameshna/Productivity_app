import { useSyncExternalStore } from 'react';

export type NoteCategory = 'Home' | 'Work' | 'Bookmark' | 'Reminder';
export type NoteColor = 'parchment' | 'rose' | 'sage' | 'sky';

export interface Note {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  color: NoteColor;
  createdAt: string;
  updatedAt: string;
}

export type NotesStorageStatus = 'loading' | 'ready' | 'error';

const STORAGE_KEY = '@productivity/sticky_notes';
const FILE_NAME = 'productivity_sticky_notes.json';
const initialNotes: Note[] = [
  { id: 'sample-urgent', title: '*URGENT JOB OPENING - SUPPORT ENGINEER*', content: '', category: 'Work', color: 'parchment', createdAt: '2026-10-17T14:54:00.000Z', updatedAt: '2026-10-17T14:54:00.000Z' },
  { id: 'sample-links', title: '', content: 'Hejwuehehehehehege\nbeghttps://youtube\n.com/shorts/X\n_iqUWjaKkY?si=\nryAx504NSMH6yt5J\nwww.godaddy.com', category: 'Home', color: 'parchment', createdAt: '2026-10-17T14:28:00.000Z', updatedAt: '2026-10-17T14:28:00.000Z' },
  { id: 'sample-gfff', title: 'Gfff', content: '', category: 'Home', color: 'parchment', createdAt: '2026-10-17T14:31:00.000Z', updatedAt: '2026-10-17T14:31:00.000Z' },
  { id: 'sample-journal', title: 'b 🌤️ Daily Journal', content: '✨ Today’s Highlight\n\n😊 How I Feel', category: 'Home', color: 'parchment', createdAt: '2026-10-17T14:28:00.000Z', updatedAt: '2026-10-17T14:28:00.000Z' },
  { id: 'sample-heiehe', title: 'Heiehe', content: '', category: 'Work', color: 'parchment', createdAt: '2026-10-17T14:28:00.000Z', updatedAt: '2026-10-17T14:28:00.000Z' },
];

let notes: Note[] = [];
let storageStatus: NotesStorageStatus = 'loading';
let storageError: string | null = null;
const notesListeners = new Set<() => void>();
const statusListeners = new Set<() => void>();

function emitNotes() { notesListeners.forEach((listener) => listener()); }
function emitStatus() { statusListeners.forEach((listener) => listener()); }
function setStorageStatus(status: NotesStorageStatus, error: string | null = null) {
  storageStatus = status;
  storageError = error;
  emitStatus();
}

function readStorage(): Promise<string | null> {
  if (typeof window !== 'undefined' && window.localStorage) {
    return Promise.resolve(window.localStorage.getItem(STORAGE_KEY));
  }
  const fileSystem = require('expo-file-system/legacy');
  if (!fileSystem.documentDirectory) throw new Error('Notes storage is unavailable on this device.');
  const uri = `${fileSystem.documentDirectory}${FILE_NAME}`;
  return fileSystem.getInfoAsync(uri).then((info: { exists: boolean }) =>
    info.exists ? fileSystem.readAsStringAsync(uri) : null,
  );
}

function writeStorage(value: string): Promise<void> {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(STORAGE_KEY, value);
    return Promise.resolve();
  }
  const fileSystem = require('expo-file-system/legacy');
  if (!fileSystem.documentDirectory) throw new Error('Notes storage is unavailable on this device.');
  return fileSystem.writeAsStringAsync(`${fileSystem.documentDirectory}${FILE_NAME}`, value);
}

function normalizeNotes(value: unknown): Note[] {
  if (!Array.isArray(value)) throw new Error('Saved notes have an invalid format.');
  return value.filter((item): item is Note => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Partial<Note>;
    return typeof candidate.id === 'string' && typeof candidate.title === 'string' &&
      typeof candidate.content === 'string' && typeof candidate.createdAt === 'string' &&
      typeof candidate.updatedAt === 'string';
  }).map((item) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    category: ['Home', 'Work', 'Bookmark', 'Reminder'].includes(item.category) ? item.category : 'Home',
    color: ['parchment', 'rose', 'sage', 'sky'].includes(item.color) ? item.color : 'parchment',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}

const loadPromise = (async () => {
  try {
    const serialized = await readStorage();
    notes = serialized === null ? initialNotes.map((note) => ({ ...note })) : normalizeNotes(JSON.parse(serialized));
    setStorageStatus('ready');
  } catch (error) {
    notes = initialNotes.map((note) => ({ ...note }));
    setStorageStatus('error', error instanceof Error ? error.message : 'Notes could not be loaded from storage.');
  }
  emitNotes();
})();

let pendingWrite = Promise.resolve();
let mutationQueue = Promise.resolve();
async function persist(next: Note[]): Promise<void> {
  await loadPromise;
  pendingWrite = pendingWrite.catch(() => undefined).then(() => writeStorage(JSON.stringify(next)));
  try {
    await pendingWrite;
    notes = next;
    setStorageStatus('ready');
    emitNotes();
  } catch (error) {
    setStorageStatus('error', error instanceof Error ? error.message : 'Notes could not be saved.');
    throw error;
  }
}

function mutateNotes(mutator: (current: Note[]) => Note[]): Promise<void> {
  const operation = mutationQueue.catch(() => undefined).then(async () => {
    await loadPromise;
    await persist(mutator(notes));
  });
  mutationQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

export function getNotes(): Note[] { return notes; }
export function subscribeNotes(listener: () => void) { notesListeners.add(listener); return () => notesListeners.delete(listener); }
export function useNotes() { return useSyncExternalStore(subscribeNotes, getNotes, getNotes); }
export function getNotesStorageStatus() { return storageStatus; }
export function getNotesStorageError() { return storageError; }
export function subscribeNotesStorage(listener: () => void) { statusListeners.add(listener); return () => statusListeners.delete(listener); }
export function useNotesStorageStatus() { return useSyncExternalStore(subscribeNotesStorage, getNotesStorageStatus, getNotesStorageStatus); }
export function useNotesStorageError() { return useSyncExternalStore(subscribeNotesStorage, getNotesStorageError, getNotesStorageError); }

export async function createNote(fields: Partial<Pick<Note, 'title' | 'content' | 'category' | 'color'>> = {}): Promise<Note> {
  const timestamp = new Date().toISOString();
  const note: Note = { id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title: fields.title ?? '', content: fields.content ?? '', category: fields.category ?? 'Home', color: fields.color ?? 'parchment', createdAt: timestamp, updatedAt: timestamp };
  await mutateNotes((current) => [note, ...current]);
  return note;
}

export async function updateNote(id: string, patch: Partial<Pick<Note, 'title' | 'content' | 'category' | 'color'>>): Promise<void> {
  const timestamp = new Date().toISOString();
  await mutateNotes((current) => current.map((note) => note.id === id ? { ...note, ...patch, updatedAt: timestamp } : note));
}

export async function deleteNote(id: string): Promise<void> {
  await mutateNotes((current) => current.filter((note) => note.id !== id));
}
