'use client'

import { ReactNode, useEffect, useMemo, useState, createContext, useContext } from 'react'
import { ThemeProvider as MuiThemeProvider, createTheme, PaletteMode } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

interface ThemeModeContextType {
  mode: PaletteMode
  toggleThemeMode: () => void
}

const ThemeModeContext = createContext<ThemeModeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>('light')

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('zuve-theme') : null
    if (saved === 'light' || saved === 'dark') setMode(saved)
  }, [])

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: '#1976d2' },
      secondary: { main: '#dc004e' },
      background: { default: mode === 'light' ? '#fafafa' : '#0f1115', paper: mode === 'light' ? '#ffffff' : '#111827' },
    },
    shape: { borderRadius: 8 },
    typography: { fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif' },
  }), [mode])

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem('zuve-theme', mode)
  }, [mode])

  const toggleThemeMode = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeModeContext.Provider value={{ mode, toggleThemeMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  )
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext)
  if (context === undefined) {
    throw new Error('useThemeMode must be used within a ThemeProvider')
  }
  return context
}



