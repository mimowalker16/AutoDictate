import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Note } from '@/types/note';
import { loadNotes, saveNotes } from '@/services/storage';

type NotesContextValue = {
  notes: Note[];
  ready: boolean;
  addNote: (note: Note) => Promise<void>;
  updateNote: (id: string, data: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  getNote: (id: string) => Note | undefined;
  refresh: () => Promise<void>;
};

const NotesContext = createContext<NotesContextValue>({
  notes: [],
  ready: false,
  addNote: async () => {},
  updateNote: async () => {},
  deleteNote: async () => {},
  getNote: () => undefined,
  refresh: async () => {},
});

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [ready, setReady] = useState(false);

  const persist = useCallback(async (next: Note[]) => {
    setNotes(next);
    await saveNotes(next);
  }, []);

  const refresh = useCallback(async () => {
    const stored = await loadNotes();
    setNotes(
      stored.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    );
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addNote = useCallback(
    async (note: Note) => {
      const next = [note, ...notes].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      await persist(next);
    },
    [notes, persist],
  );

  const updateNote = useCallback(
    async (id: string, data: Partial<Note>) => {
      const next = notes.map((note) => (note.id === id ? { ...note, ...data } : note));
      await persist(next);
    },
    [notes, persist],
  );

  const getNote = useCallback(
    (id: string) => notes.find((note) => note.id === id),
    [notes],
  );

  const deleteNote = useCallback(
    async (id: string) => {
      const next = notes.filter((n) => n.id !== id);
      await persist(next);
    },
    [notes, persist],
  );

  return (
    <NotesContext.Provider
      value={{ notes, ready, addNote, updateNote, deleteNote, getNote, refresh }}>
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => useContext(NotesContext);
