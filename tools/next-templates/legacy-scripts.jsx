'use client';

import {useEffect} from 'react';

// Share pending loads so React's development effect replay cannot initialize a script twice.
const loaded = new Map();
function loadScript(entry) {
  const key = `${entry.type || 'classic'}:${entry.src}`;
  if (!loaded.has(key)) loaded.set(key, new Promise((resolve, reject) => {
    const node = document.createElement('script');
    node.src = entry.src;
    if (entry.type) node.type = entry.type;
    node.async = false;
    node.onload = resolve;
    node.onerror = () => { loaded.delete(key); reject(new Error(`Site script failed: ${entry.src}`)); };
    document.body.appendChild(node);
  }));
  return loaded.get(key);
}

// The original site uses full-page links. Initialize its existing behavior after React hydrates.
export default function LegacyScripts({scripts}) {
  useEffect(() => {
    let disposed = false;
    async function load() {
      for (const entry of scripts) {
        if (disposed) return;
        await loadScript(entry);
      }
    }
    void load().catch(error => console.error(error));
    return () => { disposed = true; };
  }, [scripts]);
  return null;
}
