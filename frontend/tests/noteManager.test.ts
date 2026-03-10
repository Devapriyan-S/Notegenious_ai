import { describe, it, expect, beforeEach } from 'vitest';

// --- Note types and manager (mirrors page.tsx logic) ---

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

let idCounter = 0;
function generateId(): string {
  return `note-${++idCounter}`;
}

function createNote(title = 'Untitled Note', content = ''): Note {
  const now = Date.now();
  return { id: generateId(), title, content, createdAt: now, updatedAt: now };
}

class NoteManager {
  private notes: Note[] = [];
  private selectedId: string | null = null;

  create(title?: string, content?: string): Note {
    const note = createNote(title, content);
    this.notes.unshift(note);
    this.selectedId = note.id;
    return note;
  }

  update(id: string, updates: Partial<Pick<Note, 'title' | 'content'>>): boolean {
    const idx = this.notes.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    this.notes[idx] = { ...this.notes[idx], ...updates, updatedAt: Date.now() };
    return true;
  }

  delete(id: string): boolean {
    const prev = this.notes;
    this.notes = prev.filter((n) => n.id !== id);
    if (this.selectedId === id) {
      this.selectedId = this.notes[0]?.id ?? null;
    }
    return this.notes.length < prev.length;
  }

  search(query: string): Note[] {
    const q = query.toLowerCase();
    return this.notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }

  getAll(): Note[] {
    return [...this.notes];
  }

  getById(id: string): Note | undefined {
    return this.notes.find((n) => n.id === id);
  }

  getSelected(): Note | null {
    return this.notes.find((n) => n.id === this.selectedId) ?? null;
  }

  select(id: string): boolean {
    if (!this.notes.find((n) => n.id === id)) return false;
    this.selectedId = id;
    return true;
  }
}

// --- Tests ---

describe('NoteManager', () => {
  let manager: NoteManager;

  beforeEach(() => {
    idCounter = 0;
    manager = new NoteManager();
  });

  describe('create', () => {
    it('creates a note with default title', () => {
      const note = manager.create();
      expect(note.title).toBe('Untitled Note');
      expect(note.content).toBe('');
    });

    it('creates a note with custom title and content', () => {
      const note = manager.create('My Note', 'Hello world');
      expect(note.title).toBe('My Note');
      expect(note.content).toBe('Hello world');
    });

    it('adds note to the front of the list', () => {
      manager.create('First');
      manager.create('Second');
      const all = manager.getAll();
      expect(all[0].title).toBe('Second');
      expect(all[1].title).toBe('First');
    });

    it('auto-selects the new note', () => {
      const note = manager.create('Test');
      expect(manager.getSelected()?.id).toBe(note.id);
    });

    it('assigns unique ids', () => {
      const n1 = manager.create();
      const n2 = manager.create();
      expect(n1.id).not.toBe(n2.id);
    });

    it('sets createdAt and updatedAt timestamps', () => {
      const before = Date.now();
      const note = manager.create();
      const after = Date.now();
      expect(note.createdAt).toBeGreaterThanOrEqual(before);
      expect(note.createdAt).toBeLessThanOrEqual(after);
      expect(note.updatedAt).toBe(note.createdAt);
    });
  });

  describe('update', () => {
    it('updates title', () => {
      const note = manager.create('Old Title');
      manager.update(note.id, { title: 'New Title' });
      expect(manager.getById(note.id)?.title).toBe('New Title');
    });

    it('updates content', () => {
      const note = manager.create('Title', 'Old content');
      manager.update(note.id, { content: 'New content' });
      expect(manager.getById(note.id)?.content).toBe('New content');
    });

    it('updates updatedAt timestamp', () => {
      const note = manager.create();
      const before = Date.now();
      manager.update(note.id, { title: 'Updated' });
      expect(manager.getById(note.id)?.updatedAt).toBeGreaterThanOrEqual(before);
    });

    it('returns false for non-existent id', () => {
      expect(manager.update('bad-id', { title: 'x' })).toBe(false);
    });

    it('does not modify other notes', () => {
      const n1 = manager.create('Note 1');
      const n2 = manager.create('Note 2');
      manager.update(n1.id, { title: 'Updated 1' });
      expect(manager.getById(n2.id)?.title).toBe('Note 2');
    });
  });

  describe('delete', () => {
    it('removes a note', () => {
      const note = manager.create();
      manager.delete(note.id);
      expect(manager.getById(note.id)).toBeUndefined();
    });

    it('returns true when deleted successfully', () => {
      const note = manager.create();
      expect(manager.delete(note.id)).toBe(true);
    });

    it('returns false for non-existent id', () => {
      expect(manager.delete('bad-id')).toBe(false);
    });

    it('selects the next note when selected note is deleted', () => {
      const n1 = manager.create('First');
      const n2 = manager.create('Second'); // n2 is now selected (front of list)
      manager.delete(n2.id);
      expect(manager.getSelected()?.id).toBe(n1.id);
    });

    it('sets selected to null when last note is deleted', () => {
      const note = manager.create();
      manager.delete(note.id);
      expect(manager.getSelected()).toBeNull();
    });

    it('decreases note count', () => {
      manager.create();
      manager.create();
      manager.delete(manager.getAll()[0].id);
      expect(manager.getAll()).toHaveLength(1);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      manager.create('Meeting Notes', 'Discussed project roadmap');
      manager.create('Shopping List', 'Milk, eggs, bread');
      manager.create('Ideas', 'Build a new app');
    });

    it('finds by title', () => {
      const results = manager.search('meeting');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Meeting Notes');
    });

    it('finds by content', () => {
      const results = manager.search('milk');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Shopping List');
    });

    it('is case-insensitive', () => {
      expect(manager.search('MEETING')).toHaveLength(1);
      expect(manager.search('meeting')).toHaveLength(1);
    });

    it('returns all notes for empty query', () => {
      expect(manager.search('')).toHaveLength(3);
    });

    it('returns empty array for no matches', () => {
      expect(manager.search('xyzzy')).toHaveLength(0);
    });

    it('matches partial words', () => {
      const results = manager.search('road');
      expect(results).toHaveLength(1);
    });
  });

  describe('select', () => {
    it('selects a note by id', () => {
      const n1 = manager.create('Note 1');
      const n2 = manager.create('Note 2');
      manager.select(n1.id);
      expect(manager.getSelected()?.id).toBe(n1.id);
      manager.select(n2.id);
      expect(manager.getSelected()?.id).toBe(n2.id);
    });

    it('returns false for non-existent id', () => {
      expect(manager.select('bad-id')).toBe(false);
    });
  });
});
