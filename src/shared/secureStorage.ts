const DB_NAME = 'ranktica_secure_db';
const STORE_NAME = 'secure_cache';
const KEY_SALT = 'R@nkt1ca_S3cur3S@lt_2026_Cl13ntK3y!';

const isCryptoSupported = typeof window !== 'undefined' && window.crypto && typeof window.crypto.subtle !== 'undefined';

let cachedCryptoKey: CryptoKey | null = null;

async function getCryptoKey(): Promise<CryptoKey> {
  if (cachedCryptoKey) return cachedCryptoKey;
  
  const pwUtf8 = new TextEncoder().encode(KEY_SALT);
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    pwUtf8,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  cachedCryptoKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('RankticaStaticSaltValue'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  return cachedCryptoKey;
}

// Legacy XOR cipher functions for fallback and backward-compatibility
function xorEncrypt(text: string): string {
  try {
    const asciiText = encodeURIComponent(text);
    let result = '';
    for (let i = 0; i < asciiText.length; i++) {
       const charCode = asciiText.charCodeAt(i) ^ KEY_SALT.charCodeAt(i % KEY_SALT.length);
       result += String.fromCharCode(charCode);
    }
    return result;
  } catch (e) {
    return unescape(encodeURIComponent(text));
  }
}

function xorDecrypt(rawText: string): string {
  try {
    let result = '';
    for (let i = 0; i < rawText.length; i++) {
      const charCode = rawText.charCodeAt(i) ^ KEY_SALT.charCodeAt(i % KEY_SALT.length);
      result += String.fromCharCode(charCode);
    }
    return decodeURIComponent(result);
  } catch (e) {
    return rawText;
  }
}

// AES-GCM Encryption
async function encrypt(text: string): Promise<string> {
  if (!text) return '';
  if (!isCryptoSupported) {
    return 'legacy_xor:' + btoa(xorEncrypt(text));
  }
  
  try {
    const key = await getCryptoKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);
    
    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encoded
    );
    
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    
    let binary = '';
    const len = combined.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return 'aes-gcm:' + btoa(binary);
  } catch (e) {
    console.warn('[SecureStorage] AES-GCM encryption failed, falling back to legacy XOR:', e);
    return 'legacy_xor:' + btoa(xorEncrypt(text));
  }
}

// AES-GCM Decryption (supports both legacy format and modern AES-GCM)
async function decrypt(ciphertext: string): Promise<string> {
  if (!ciphertext) return '';
  
  if (ciphertext.startsWith('aes-gcm:')) {
    if (!isCryptoSupported) {
      console.warn('[SecureStorage] Data is stored in AES-GCM, but Web Crypto is not supported in this environment.');
      return '';
    }
    try {
      const base64Part = ciphertext.slice('aes-gcm:'.length);
      const binary = atob(base64Part);
      const len = binary.length;
      const combined = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        combined[i] = binary.charCodeAt(i);
      }
      
      const iv = combined.slice(0, 12);
      const ciphertextBytes = combined.slice(12);
      
      const key = await getCryptoKey();
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        ciphertextBytes
      );
      
      return new TextDecoder().decode(decrypted);
    } catch (e) {
      console.error('[SecureStorage] AES-GCM decryption failed, returning empty string:', e);
      return '';
    }
  }
  
  // Backward compatibility with legacy XOR format or direct base64
  let rawCiphertext = ciphertext;
  if (ciphertext.startsWith('legacy_xor:')) {
    rawCiphertext = ciphertext.slice('legacy_xor:'.length);
  }
  
  try {
    const decoded = atob(rawCiphertext);
    return xorDecrypt(decoded);
  } catch (e) {
    try {
      return decodeURIComponent(escape(atob(ciphertext)));
    } catch (fallbackError) {
      console.warn('[SecureStorage] Decryption fallback failed:', e);
      return ciphertext;
    }
  }
}

// Database initialisation Promise
let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    try {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not supported in this environment'));
        return;
      }
      const request = indexedDB.open(DB_NAME, 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      
      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };
      
      request.onerror = (event) => {
        reject(request.error || new Error('Failed to open secure database'));
      };
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
  
  return dbPromise;
}

export const secureStorage = {
  /**
   * Retrieves an item from secure IndexedDB and decrypts it
   */
  getItem: async (key: string): Promise<string | null> => {
    try {
      const db = await getDB();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        
        request.onsuccess = async () => {
          const encryptedVal = request.result;
          if (encryptedVal) {
            const decrypted = await decrypt(encryptedVal);
            resolve(decrypted);
          } else {
            // Check fallback to localStorage just in case we are migrating
            const fallbackVal = localStorage.getItem(key);
            if (fallbackVal) {
              const decryptedVal = await decrypt(fallbackVal);
              // Automatically migrate to IndexedDB in the background
              secureStorage.setItem(key, decryptedVal).catch(console.error);
              resolve(decryptedVal);
            } else {
              resolve(null);
            }
          }
        };
        
        request.onerror = async () => {
          // Fallback to localStorage on IndexedDB fetch error
          const val = localStorage.getItem(key);
          if (val) {
            const decrypted = await decrypt(val);
            resolve(decrypted);
          } else {
            resolve(null);
          }
        };
      });
    } catch (err) {
      console.warn('[SecureStorage] Error fetching, falling back to localStorage:', err);
      const val = localStorage.getItem(key);
      if (val) {
        return decrypt(val);
      }
      return null;
    }
  },

  /**
   * Encrypts and stores an item in secure IndexedDB
   */
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      const encryptedValue = await encrypt(value);
      localStorage.setItem(key, encryptedValue);
      
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(encryptedValue, key);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('[SecureStorage] Error storing in IndexedDB, using encrypted localStorage backup:', err);
      try {
        const encryptedValue = await encrypt(value);
        localStorage.setItem(key, encryptedValue);
      } catch (encryptErr) {
        console.error('[SecureStorage] Failed to store even in localStorage:', encryptErr);
      }
    }
  },

  /**
   * Removes an item from secure IndexedDB
   */
  removeItem: async (key: string): Promise<void> => {
    localStorage.removeItem(key);
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('[SecureStorage] Error deleting from IndexedDB:', err);
    }
  },

  /**
   * Clears the secure database cache
   */
  clear: async (): Promise<void> => {
    localStorage.clear();
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('[SecureStorage] Error clearing database:', err);
    }
  }
};
