import { useEffect, useState } from 'react';

export interface ThemeParams {
  bg_color: string;
  text_color: string;
  hint_color: string;
  link_color: string;
  button_color: string;
  button_text_color: string;
  secondary_bg_color?: string;
}

// Default theme values
const defaultTheme: ThemeParams = {
  bg_color: '#ffffff',
  text_color: '#000000',
  hint_color: '#999999',
  link_color: '#2481cc',
  button_color: '#50a8eb',
  button_text_color: '#ffffff',
  secondary_bg_color: '#f4f4f5'
};

export function useThemeParams(): ThemeParams {
  const [themeParams, setThemeParams] = useState<ThemeParams>(defaultTheme);

  useEffect(() => {
    // Get theme from Telegram WebApp if available
    if (window.Telegram?.WebApp?.themeParams) {
      setThemeParams(window.Telegram.WebApp.themeParams);
    }
  }, []);

  return themeParams;
}