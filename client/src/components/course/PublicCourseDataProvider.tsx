'use client';

import { createContext, useContext } from 'react';

const PublicCourseDataContext = createContext<unknown>(null);

export function PublicCourseDataProvider({ course, children }: { course: unknown; children: React.ReactNode }) {
  return <PublicCourseDataContext.Provider value={course}>{children}</PublicCourseDataContext.Provider>;
}

export function useInitialPublicCourse<T>() {
  return useContext(PublicCourseDataContext) as T | null;
}
