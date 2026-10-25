import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext({
  dark: true,
  toggleDark: () => {},
  setDark: () => {}
})

export function ThemeProvider({ children }) {
  const [dark, setDarkState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') || localStorage.getItem('clubsync-dark')
      if (saved !== null) {
        return saved === 'dark' || saved === 'true'
      }
      return true // Default to dark mode for modern collegiate aesthetic
    }
    return true
  })

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (dark) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
        localStorage.setItem('clubsync-dark', 'true')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
        localStorage.setItem('clubsync-dark', 'false')
      }
    }
  }, [dark])

  const toggleDark = () => {
    setDarkState(prev => !prev)
  }

  const setDark = (val) => {
    setDarkState(Boolean(val))
  }

  return (
    <ThemeContext.Provider value={{ dark, toggleDark, setDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
