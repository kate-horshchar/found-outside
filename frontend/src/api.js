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
    const error = new Error(data.error?.message ?? 'Unable to complete the request.');
    error.code = data.error?.code; error.status = response.status;
    throw error;
  }
  return data;
}

export function useApi(path, body) {
  const bodyKey = JSON.stringify(body);
  const key = `${path}:${bodyKey}`;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ key: null, loading: true, data: null, error: null });
  useEffect(() => {
    if (path === null) return;
    const controller = new AbortController();
    setState({ key, loading: true, data: null, error: null });
    api(path, { body: bodyKey === undefined ? undefined : JSON.parse(bodyKey), signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setState({ key, loading: false, data, error: null }); })
      .catch(error => { if (!controller.signal.aborted) setState({ key, loading: false, data: null, error }); });
    return () => controller.abort();
  }, [path, bodyKey, key, attempt]);
  // Hide a previous quote immediately when the cart changes.
  const current = state.key === key ? state : { loading: true, data: null, error: null };
  return { ...current, retry: () => setAttempt(value => value + 1) };
}
