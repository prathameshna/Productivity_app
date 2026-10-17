import type { Note } from './notesState';

const sampleLeft = new Set(['sample-urgent', 'sample-links']);
const sampleRight = new Set(['sample-gfff', 'sample-journal', 'sample-heiehe']);

export function partitionNotes(notes: Note[], layout: 'grid' | 'list'): { left: Note[]; right: Note[] } {
  if (layout === 'list') return { left: notes, right: [] };
  const left: Note[] = [];
  const right: Note[] = [];
  let leftHeight = 0;
  let rightHeight = 0;

  notes.forEach((note) => {
    const estimatedHeight = 116 + Math.min(360, Math.ceil((note.title.length + note.content.length) / 30) * 20);
    if (sampleLeft.has(note.id)) {
      left.push(note);
      leftHeight += estimatedHeight;
    } else if (sampleRight.has(note.id)) {
      right.push(note);
      rightHeight += estimatedHeight;
    } else if (leftHeight <= rightHeight) {
      left.push(note);
      leftHeight += estimatedHeight;
    } else {
      right.push(note);
      rightHeight += estimatedHeight;
    }
  });

  return { left, right };
}
