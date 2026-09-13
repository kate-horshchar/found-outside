import { useEffect, useState } from 'react';

export async function api(path, { body, signal } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body), signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Unable to reach the store. Please try again.');
  }
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error?.message ?? 'Unable to complete the request');
    error.code = data.error?.code; error.status = response.status;
    throw error;
  }
  return data;
}

// Responses for callers that opt in with `cache`, so a page can render its last
// known data immediately when revisited (e.g. Back to the catalogue) and refresh silently.
const responseCache = new Map();

function pendingState(key, previous, { keepPrevious, cache }) {
  if (cache && responseCache.has(key)) return { key, loading: false, data: responseCache.get(key), error: null };
  return { key, loading: true, data: keepPrevious ? previous?.data ?? null : null, error: null };
}

export function useApi(path, body, { keepPrevious = false, cache = false } = {}) {
  const bodyKey = JSON.stringify(body);
  const key = `${path}:${bodyKey}`;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState(() => pendingState(key, null, { keepPrevious, cache }));
  useEffect(() => {
    if (path === null) return;
    const controller = new AbortController();
    // Keep data already shown for this key (a cached response); otherwise enter the pending state.
    setState(previous => previous.key === key && previous.data !== null ? previous : pendingState(key, previous, { keepPrevious, cache }));
    api(path, { body: bodyKey === undefined ? undefined : JSON.parse(bodyKey), signal: controller.signal })
      .then(data => {
        if (controller.signal.aborted) return;
        if (cache) responseCache.set(key, data);
        setState({ key, loading: false, data, error: null });
      })
      .catch(error => { if (!controller.signal.aborted) setState({ key, loading: false, data: null, error }); });
    return () => controller.abort();
  }, [path, bodyKey, key, attempt, keepPrevious, cache]);
  // Hide a previous quote immediately when the cart changes, unless the caller
  // opts into keeping stale data on screen (keeps layout height stable while refetching).
  const current = state.key === key ? state : pendingState(key, state, { keepPrevious, cache });
  return { ...current, retry: () => setAttempt(value => value + 1) };
}
