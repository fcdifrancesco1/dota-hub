import React, { createContext, useContext } from 'react';

// O site só tem o tema claro (o index.html já marca data-theme="light").
// O contexto continua existindo para os componentes que leem `theme`.
const ThemeContext = createContext({ theme: 'light' });

export function ThemeProvider({ children }) {
  return <ThemeContext.Provider value={{ theme: 'light' }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
