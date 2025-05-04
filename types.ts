// Define the structure of Telegram WebApp user
export interface TelegramWebAppUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

// Define the structure of Telegram launch params
export interface LaunchParams {
  tgWebAppBotInline?: boolean;
  tgWebAppData?: any;
  tgWebAppStartParam?: string;
  tgWebAppVersion?: string;
  tgWebAppPlatform?: string;
  tgWebAppColorScheme?: string;
  tgWebAppThemeParams?: any;
  tgWebAppInitData?: string;
  tgWebAppInitDataUnsafe?: {
    user?: TelegramWebAppUser;
    chat?: any;
    start_param?: string;
    auth_date?: number;
    hash?: string;
  };
  user?: TelegramWebAppUser; // This is where Telegram puts the user data
}

// Define the type for showPopup callback function
export type ShowPopupCallback = (buttonId: string, value?: string) => void;

// Define the button type for showPopup
export interface TelegramPopupButton {
  id: string;
  type: "default" | "cancel" | "destructive";
  text: string;
}