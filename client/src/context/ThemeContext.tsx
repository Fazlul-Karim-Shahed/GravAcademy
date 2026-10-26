'use client';

import React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="grav_theme"
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
};

export const useTheme = () => {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  
  const currentTheme = (resolvedTheme || theme || 'dark') as 'light' | 'dark';

  const toggleTheme = () => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  return {
    theme: currentTheme,
    toggleTheme,
    setTheme,
  };
};
