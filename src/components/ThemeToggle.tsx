'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? theme === 'dark' : false;

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="relative p-2 rounded-xl transition-all duration-300 group flex items-center justify-center bg-coffee-100/70 hover:bg-coffee-200/80 text-coffee-800 dark:bg-espresso-card dark:hover:bg-coffee-950 dark:text-amber-300 dark:border dark:border-espresso-border shadow-xs hover:scale-105 active:scale-95"
      title={isDark ? 'Ganti ke Tema Terang (Light Mode)' : 'Ganti ke Tema Gelap (Dark Mode)'}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
      ) : (
        <Moon className="w-5 h-5 text-coffee-700 dark:text-amber-300 group-hover:-rotate-12 transition-transform duration-300" />
      )}
    </button>
  );
}
