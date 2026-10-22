import { api } from './api';

export interface AcademicClassItem {
  _id: string;
  name: string;
  order: number;
  description?: string;
  subjects?: string[];
  createdAt?: string;
}

const STORAGE_KEY = 'grav_academic_classes';

export const DEFAULT_ACADEMIC_CLASSES: AcademicClassItem[] = [
  { _id: 'class-6', name: 'Class 6', order: 1, subjects: [] },
  { _id: 'class-7', name: 'Class 7', order: 2, subjects: [] },
  { _id: 'class-8', name: 'Class 8', order: 3, subjects: [] },
  { _id: 'class-9', name: 'Class 9', order: 4, subjects: [] },
  { _id: 'class-10', name: 'Class 10', order: 5, subjects: [] },
  { _id: 'class-11', name: 'Class 11', order: 6, subjects: [] },
  { _id: 'class-12', name: 'Class 12', order: 7, subjects: [] },
];

/**
 * Single source of truth to fetch academic classes across the whole app.
 * If backend responds with classes, it caches them in localStorage and returns them.
 * If backend is 404/down or empty, it returns the locally persisted classes.
 */
export async function getSharedAcademicClasses(): Promise<AcademicClassItem[]> {
  try {
    const res = await api.get('/classes');
    if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data.data));
      }
      return res.data.data;
    }
  } catch (err) {
    // Backend offline / 404 before git push
  }

  // Fallback to single shared storage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to read classes from localStorage:', e);
    }
  }

  return DEFAULT_ACADEMIC_CLASSES;
}

/**
 * Single source of truth to save academic classes across the whole app.
 */
export async function saveSharedAcademicClasses(updatedList: AcademicClassItem[]): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      // Dispatch custom window event so any open component/tab updates instantly
      window.dispatchEvent(new Event('grav_classes_updated'));
    } catch (e) {
      console.warn('Failed to write classes to localStorage:', e);
    }
  }
}
