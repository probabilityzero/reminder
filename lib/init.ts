interface InitOptions {
  debug?: boolean;
  eruda?: boolean;
  mockForMacOS?: boolean;
}

/**
 * Initializes the application and configures its dependencies.
 */
export async function init(options: InitOptions = {}): Promise<void> {
  const { debug = false, eruda = false } = options;

  if (debug) {
    console.log('Debug mode enabled');
  }

  if (eruda) {
    // Load eruda dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/eruda';
    document.body.appendChild(script);
    
    return new Promise<void>((resolve) => {
      script.onload = () => {
        // @ts-ignore
        window.eruda.init();
        resolve();
      };
    });
  }

  // Fixed: Use Promise.resolve() without generic type parameter
  // or provide undefined as the value for void type
  return Promise.resolve();
}