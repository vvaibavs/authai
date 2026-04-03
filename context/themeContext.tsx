'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { themes, defaultTheme, type ThemeKey } from '@/lib/themes'

type ThemeContextValue = {
  isDark: boolean
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>(defaultTheme)

  useEffect(() => {
    const saved = localStorage.getItem('theme') as ThemeKey | null
    if (saved === 'dark') setThemeKey('dark')
  }, [])

  useEffect(() => {
    const colors = themes[themeKey].colors
    const root = document.documentElement
    for (const [key, value] of Object.entries(colors)) {
      root.style.setProperty(`--theme-${key}`, value as string)
    }
    localStorage.setItem('theme', themeKey)
  }, [themeKey])

  const toggle = () => setThemeKey(k => (k === 'light' ? 'dark' : 'light'))

  return (
    <ThemeContext.Provider value={{ isDark: themeKey === 'dark', toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
