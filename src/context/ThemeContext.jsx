import React, { createContext, useContext } from 'react';

// O site usa o tema escuro, no estilo do cliente do Dota 2 (o index.html marca data-theme="dark").
// O contexto continua existindo para os componentes que leem `theme`.
const ThemeContext = createContext({ theme: 'dark' });

export function ThemeProvider({ children }) {
  return <ThemeContext.Provider value={{ theme: 'dark' }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
