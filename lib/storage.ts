// IndexedDB storage utility for large data sets
const DB_NAME = 'LinkedInDataDB';
const STORE_NAME = 'linkedinData';
const DB_VERSION = 1;

export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function storeLinkedInData(data: any, exportDate: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Clear old data first
    await store.clear();
    
    // Store new data
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ id: 'current', data, exportDate, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    db.close();
  } catch (error) {
    console.error('Error storing data in IndexedDB:', error);
    throw error;
  }
}

export async function getLinkedInData(): Promise<{ data: any; exportDate: string } | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get('current');
      request.onsuccess = () => {
        const result = request.result;
        db.close();
        if (result) {
          resolve({ data: result.data, exportDate: result.exportDate });
        } else {
          resolve(null);
        }
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error reading data from IndexedDB:', error);
    return null;
  }
}

export async function clearLinkedInData(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await store.clear();
    db.close();
  } catch (error) {
    console.error('Error clearing data from IndexedDB:', error);
  }
}

