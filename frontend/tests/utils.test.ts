import { describe, it, expect } from 'vitest';

// --- Utility functions (mirrored from Editor.tsx) ---

function sanitizeFilename(title: string): string {
  return title.replace(/[^a-z0-9\s-_]/gi, '').trim().replace(/\s+/g, '_') || 'note';
}

function formatNoteAsTxt(title: string, content: string): string {
  return `${title}\n${'='.repeat(Math.max(title.length, 11))}\n${content}`;
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// --- Tests ---

describe('sanitizeFilename', () => {
  it('replaces spaces with underscores', () => {
    expect(sanitizeFilename('My Note')).toBe('My_Note');
  });

  it('removes special characters', () => {
    expect(sanitizeFilename('Note: Hello! World?')).toBe('Note_Hello_World');
  });

  it('returns "note" for empty string', () => {
    expect(sanitizeFilename('')).toBe('note');
  });

  it('returns "note" for string with only special chars', () => {
    expect(sanitizeFilename('!@#$%')).toBe('note');
  });

  it('preserves hyphens and underscores', () => {
    expect(sanitizeFilename('my-note_here')).toBe('my-note_here');
  });

  it('trims leading and trailing spaces', () => {
    expect(sanitizeFilename('  hello  ')).toBe('hello');
  });

  it('handles alphanumeric title', () => {
    expect(sanitizeFilename('Note123')).toBe('Note123');
  });

  it('collapses multiple spaces into single underscore', () => {
    expect(sanitizeFilename('hello   world')).toBe('hello_world');
  });
});

describe('formatNoteAsTxt', () => {
  it('formats title and content with separator', () => {
    const result = formatNoteAsTxt('My Note', 'Hello world');
    expect(result).toBe('My Note\n===========\nHello world');
  });

  it('uses minimum separator length of 11', () => {
    const result = formatNoteAsTxt('Hi', 'content');
    expect(result).toBe('Hi\n===========\ncontent');
  });

  it('uses title length if longer than 11', () => {
    const title = 'A Very Long Title Here';
    const result = formatNoteAsTxt(title, 'body');
    expect(result).toBe(`${title}\n${'='.repeat(title.length)}\nbody`);
  });

  it('handles empty content', () => {
    const result = formatNoteAsTxt('Title', '');
    expect(result).toBe('Title\n===========\n');
  });

  it('handles multiline content', () => {
    const result = formatNoteAsTxt('Note', 'Line 1\nLine 2');
    expect(result).toContain('Line 1\nLine 2');
  });
});

describe('generateId', () => {
  it('generates non-empty string', () => {
    const id = generateId();
    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('word count utility', () => {
  function wordCount(content: string): number {
    return content.split(/\s+/).filter(Boolean).length;
  }

  it('counts words correctly', () => {
    expect(wordCount('hello world foo')).toBe(3);
  });

  it('returns 0 for empty string', () => {
    expect(wordCount('')).toBe(0);
  });

  it('handles multiple spaces', () => {
    expect(wordCount('hello   world')).toBe(2);
  });

  it('handles newlines', () => {
    expect(wordCount('hello\nworld')).toBe(2);
  });
});
