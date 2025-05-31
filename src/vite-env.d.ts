/// <reference types="vite/client" />

// Google Analytics gtag types
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'set',
      targetId: string,
      config?: any
    ) => void;
  }
}

export {};
