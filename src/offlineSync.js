import localforage from "localforage";

const originalFetch = window.fetch;

export async function syncOfflineQueue() {
  if (!navigator.onLine) return;
  
  const queue = await localforage.getItem("offline_sync_queue") || [];
  if (queue.length === 0) return;
  
  console.log("Syncing offline queue...", queue.length, "items");
  const failedQueue = [];
  
  for (const req of queue) {
    try {
      await originalFetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body
      });
    } catch (err) {
      console.error("Sync failed for", req.url, err);
      failedQueue.push(req);
    }
  }
  
  await localforage.setItem("offline_sync_queue", failedQueue);
}

window.addEventListener('online', syncOfflineQueue);

// Override fetch globally
window.fetch = async function(url, options = {}) {
  // Only intercept API calls
  if (typeof url === 'string' && url.includes('/api/')) {
    const method = options.method || 'GET';
    
    // Add API base URL if relative (for Capacitor)
    const apiBase = import.meta.env.VITE_API_BASE_URL || "";
    let fetchUrl = url;
    if (url.startsWith('/api/') && apiBase) {
      fetchUrl = `${apiBase}${url}`;
    }

    if (method === 'GET') {
      try {
        const res = await originalFetch(fetchUrl, options);
        if (res.ok) {
          const clone = res.clone();
          const data = await clone.json();
          await localforage.setItem(`cache_${url}`, data);
        }
        return res;
      } catch (err) {
        console.log("Offline mode: falling back to cache for", url);
        const cached = await localforage.getItem(`cache_${url}`);
        if (cached) {
          return new Response(JSON.stringify(cached), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        throw err;
      }
    } else {
      // POST, PUT, DELETE
      try {
        if (!navigator.onLine) throw new Error("Offline");
        return await originalFetch(fetchUrl, options);
      } catch (err) {
        console.log("Offline mode: queueing mutation for", url);
        const queue = await localforage.getItem("offline_sync_queue") || [];
        queue.push({
          url: fetchUrl,
          method: method,
          headers: options.headers,
          body: options.body
        });
        await localforage.setItem("offline_sync_queue", queue);
        
        // Optimistic mock response
        return new Response(JSON.stringify({ success: true, offline: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }
  
  return originalFetch(url, options);
};
