import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '@/types/note';

const STORAGE_KEY = '@autodictate/notes';

export const loadNotes = async (): Promise<Note[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Note[];
  } catch (error) {
    console.warn('Failed to load notes', error);
    return [];
  }
};

export const saveNotes = async (notes: Note[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (error) {
    console.warn('Failed to save notes', error);
  }
};
