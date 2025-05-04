// This file provides mock data for local development testing

// Declare function parameter types
interface HapticFeedback {
  impactOccurred: (style: string) => void;
  notificationOccurred: (type: string) => void;
  selectionChanged: () => void;
}

interface CloudStorage {
  setItem: (key: string, value: string) => Promise<void>;
  getItem: (key: string) => Promise<string | null>;
  getItems: (keys: string[]) => Promise<Record<string, string | null>>;
  removeItem: (key: string) => Promise<void>;
  removeItems: (keys: string[]) => Promise<void>;
  getKeys: () => Promise<string[]>;
}

interface MainButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  setText: (text: string) => MainButton;
  show: () => MainButton;
  hide: () => MainButton;
  enable: () => MainButton;
  disable: () => MainButton;
  showProgress: () => MainButton;
  hideProgress: () => MainButton;
  onClick: (callback: () => void) => MainButton;
  _callback?: () => void;
}

interface BackButton {
  isVisible: boolean;
  show: () => BackButton;
  hide: () => BackButton;
  onClick: (callback: () => void) => BackButton;
  _callback?: () => void;
}

// Declare Telegram object type for TypeScript
interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface TelegramThemeParams {
  bg_color: string;
  text_color: string;
  hint_color: string;
  link_color: string;
  button_color: string;
  button_text_color: string;
  secondary_bg_color?: string;
  [key: string]: string | undefined;
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
  themeParams: TelegramThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  MainButton: MainButton;
  BackButton: BackButton;
  HapticFeedback: HapticFeedback;
  CloudStorage: CloudStorage;
  ready: () => void;
  expand: () => void;
  close: () => void;
  onEvent: (eventType: string, callback: () => void) => () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  isVersionAtLeast: (version: string) => boolean;
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
    language_code: "en",
    photo_url: "https://placehold.co/200x200/50a8eb/ffffff?text=T"
  };

  window.Telegram = {
    WebApp: {
      // Update to a more recent version (minimum 6.7)
      version: "6.9",
      platform: "web",
      initData: "mock_init_data",
      initDataUnsafe: {
        user: mockUser,
        auth_date: Math.floor(Date.now() / 1000),
        hash: "mock_hash",
        query_id: "mock_query_id"
      },
      colorScheme: "light",
      themeParams: {
        bg_color: "#ffffff",
        text_color: "#000000",
        hint_color: "#999999",
        link_color: "#2481cc",
        button_color: "#50a8eb",
        button_text_color: "#ffffff",
        secondary_bg_color: "#f4f4f5"
      },
      isExpanded: true,
      viewportHeight: window.innerHeight,
      viewportStableHeight: window.innerHeight,
      headerColor: "#ffffff",
      backgroundColor: "#ffffff",
      MainButton: {
        text: "",
        color: "#50a8eb",
        textColor: "#ffffff",
        isVisible: false,
        isActive: true,
        isProgressVisible: false,
        setText: function(text: string) { this.text = text; return this; },
        show: function() { this.isVisible = true; return this; },
        hide: function() { this.isVisible = false; return this; },
        enable: function() { this.isActive = true; return this; },
        disable: function() { this.isActive = false; return this; },
        showProgress: function() { this.isProgressVisible = true; return this; },
        hideProgress: function() { this.isProgressVisible = false; return this; },
        onClick: function(callback: () => void) { this._callback = callback; return this; }
      },
      BackButton: {
        isVisible: false,
        show: function() { this.isVisible = true; return this; },
        hide: function() { this.isVisible = false; return this; },
        onClick: function(callback: () => void) { this._callback = callback; return this; }
      },
      ready: function() { console.log("WebApp ready called"); },
      expand: function() { console.log("WebApp expand called"); },
      close: function() { console.log("WebApp close called"); },
      onEvent: function(eventType: string, callback: () => void) {
        console.log(`WebApp subscribed to event: ${eventType}`);
        return function() { console.log(`WebApp unsubscribed from event: ${eventType}`); };
      },
      setHeaderColor: function(color: string) { this.headerColor = color; },
      setBackgroundColor: function(color: string) { this.backgroundColor = color; },
      isVersionAtLeast: function(version: string) {
        // Compare current version with required version
        const currentParts = this.version.split('.').map(Number);
        const requiredParts = version.split('.').map(Number);
        
        for (let i = 0; i < Math.max(currentParts.length, requiredParts.length); i++) {
          const currentPart = currentParts[i] || 0;
          const requiredPart = requiredParts[i] || 0;
          
          if (currentPart > requiredPart) return true;
          if (currentPart < requiredPart) return false;
        }
        
        return true; // Versions are equal
      },
      // HapticFeedback API
      HapticFeedback: {
        impactOccurred: function(style: string) { console.log(`Haptic impact: ${style}`); },
        notificationOccurred: function(type: string) { console.log(`Haptic notification: ${type}`); },
        selectionChanged: function() { console.log("Haptic selection changed"); }
      },
      // CloudStorage API (mock)
      CloudStorage: {
        setItem: function(key: string, value: string) { 
          localStorage.setItem(`tg_storage_${key}`, value);
          return Promise.resolve();
        },
        getItem: function(key: string) {
          return Promise.resolve(localStorage.getItem(`tg_storage_${key}`));
        },
        getItems: function(keys: string[]) {
          const result: Record<string, string | null> = {};
          keys.forEach(key => {
            result[key] = localStorage.getItem(`tg_storage_${key}`);
          });
          return Promise.resolve(result);
        },
        removeItem: function(key: string) {
          localStorage.removeItem(`tg_storage_${key}`);
          return Promise.resolve();
        },
        removeItems: function(keys: string[]) {
          keys.forEach(key => {
            localStorage.removeItem(`tg_storage_${key}`);
          });
          return Promise.resolve();
        },
        getKeys: function() {
          const keys: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('tg_storage_')) {
              keys.push(key.substring(11));
            }
          }
          return Promise.resolve(keys);
        }
      }
    }
  };

  console.log("Mock Telegram WebApp initialized for local development - version 6.9");
  
  // Simulate Telegram WebApp initialization events
  setTimeout(() => {
    const event = new CustomEvent('telegram-web-app-ready');
    document.dispatchEvent(event);
  }, 100);
}

export {}; // Make this a module
