import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { auth } from './infrastructure/auth/firebase';
import { initGlobalExceptionLogger } from './shared/GlobalExceptionLogger';

// Start the Centralized Global Exception Logger immediately to protect the application lifecycle
initGlobalExceptionLogger();

// Suppress React 18 / Recharts defaultProps deprecation warnings to keep the logs pristine
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const shouldSuppress = args.some(arg => 
    typeof arg === 'string' && 
    (arg.includes('defaultProps') || arg.includes('Support for defaultProps'))
  );
  if (shouldSuppress) return;
  originalConsoleError(...args);
};

const originalConsoleWarn = console.warn;
console.warn = (...args: any[]) => {
  const shouldSuppress = args.some(arg => 
    typeof arg === 'string' && 
    (arg.includes('defaultProps') || arg.includes('Support for defaultProps'))
  );
  if (shouldSuppress) return;
  originalConsoleWarn(...args);
};

// Global Fetch Interceptor to include Firebase ID Token automatically for secured backend routes
const originalFetch = window.fetch;

// Safely assess if window.fetch can be modified or redefined
let canInterceptFetch = false;
try {
  const desc = Object.getOwnPropertyDescriptor(window, 'fetch') || Object.getOwnPropertyDescriptor(Window.prototype, 'fetch');
  if (desc) {
    if (!desc.configurable && desc.get && !desc.set) {
      // Getter-only and non-configurable; any attempt to define or set will throw
      canInterceptFetch = false;
    } else if (desc.writable === false && desc.configurable === false) {
      canInterceptFetch = false;
    } else {
      canInterceptFetch = true;
    }
  } else {
    canInterceptFetch = true;
  }
} catch (e) {
  canInterceptFetch = false;
}

if (canInterceptFetch) {
  try {
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : (input && 'url' in input ? (input as any).url : ''));
        
        if (url && (url.startsWith('/api/') || url.includes('/api/'))) {
          if (!url.includes('/api/webhooks/stripe')) {
            try {
              const newInit = { ...init } as RequestInit;
              const headers = new Headers(newInit.headers || {});
              
              // Inject simulated role from localStorage if configured
              const simulatedRole = localStorage.getItem('ranktica_simulated_role');
              if (simulatedRole) {
                headers.set('X-Simulated-Role', simulatedRole);
              }
              
              const currentUser = auth.currentUser;
              if (currentUser) {
                const token = await currentUser.getIdToken();
                if (token) {
                  headers.set('Authorization', `Bearer ${token}`);
                }
              }
              
              newInit.headers = headers;
              return originalFetch(input, newInit);
            } catch (err) {
              console.error('[Fetch Interceptor] Error processing API headers:', err);
              return originalFetch(input, init);
            }
          }
        }
        return originalFetch(input, init);
      }
    });
  } catch (e) {
    console.warn('[Fetch Interceptor] Object.defineProperty on window.fetch failed:', e);
  }
} else {
  console.info('[Fetch Interceptor] Environment restricts fetch redefinition. Running in clean pass-through mode.');
}


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('ServiceWorker registered with scope: ', reg.scope);
    }).catch((err) => {
      console.error('ServiceWorker registration failed: ', err);
    });
  });
}
