// This file provides mock data for local development testing

// Declare Telegram object type for TypeScript
interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramWebAppUser;
    [key: string]: any;
  };
  version: string;
  platform: string;
  colorScheme: string;
  themeParams: {
    [key: string]: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  ready: () => void;
  expand: () => void;
  close: () => void;
  [key: string]: any;
}

// Extend Window interface to include Telegram property
declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

// Only mock if WebApp is not available (i.e., in browser, not in Telegram)
if (!window.Telegram?.WebApp) {
  const mockUser = {
    id: 123456789,
    first_name: "Test",
    last_name: "User", 
    username: "testuser",
    language_code: "en"
  };

  window.Telegram = {
    WebApp: {
      initData: "",
      initDataUnsafe: {
        user: mockUser
      },
      version: "6.0",
      platform: "web",
      colorScheme: "light",
      themeParams: {
        bg_color: "#ffffff",
        text_color: "#000000",
        hint_color: "#999999",
        link_color: "#2481cc",
        button_color: "#50a8eb",
        button_text_color: "#ffffff",
      },
      isExpanded: true,
      viewportHeight: window.innerHeight,
      viewportStableHeight: window.innerHeight,
      headerColor: "#ffffff",
      backgroundColor: "#ffffff",
      ready: () => {},
      expand: () => {},
      close: () => {}
    }
  };

  console.log("Mock Telegram WebApp initialized for local development");
}

export {}; // Make this a module
