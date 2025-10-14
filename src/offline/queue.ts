import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDB extends DBSchema {
  mutations: {
    key: string;
    value: {
      id: string;
      url: string;
      method: string;
      headers: Record<string, string>;
      body: string;
      timestamp: number;
    };
  };
  cache: {
    key: string;
    value: {
      key: string;
      data: any;
      timestamp: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDB>('cidertrack-offline', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('mutations')) {
          db.createObjectStore('mutations', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
};

export const enqueueMutation = async (
  url: string,
  method: string,
  headers: Record<string, string>,
  body: any
) => {
  const db = await getDB();
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  await db.add('mutations', {
    id,
    url,
    method,
    headers,
    body: JSON.stringify(body),
    timestamp: Date.now(),
  });
  
  return id;
};

export const getPendingMutations = async () => {
  const db = await getDB();
  return await db.getAll('mutations');
};

export const removeMutation = async (id: string) => {
  const db = await getDB();
  await db.delete('mutations', id);
};

export const processPendingMutations = async () => {
  const mutations = await getPendingMutations();
  const results: { success: string[]; failed: string[] } = {
    success: [],
    failed: [],
  };

  for (const mutation of mutations) {
    try {
      const response = await fetch(mutation.url, {
        method: mutation.method,
        headers: mutation.headers,
        body: mutation.body,
      });

      if (response.ok) {
        await removeMutation(mutation.id);
        results.success.push(mutation.id);
      } else {
        results.failed.push(mutation.id);
      }
    } catch (error) {
      results.failed.push(mutation.id);
    }
  }

  return results;
};

export const cacheData = async (key: string, data: any) => {
  const db = await getDB();
  await db.put('cache', {
    key,
    data,
    timestamp: Date.now(),
  });
};

export const getCachedData = async (key: string) => {
  const db = await getDB();
  const cached = await db.get('cache', key);
  return cached?.data;
};

export const clearCache = async () => {
  const db = await getDB();
  await db.clear('cache');
  await db.clear('mutations');
};
