import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  const [status, setStatus] = useState('Checking connection…');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    async function checkHealth() {
      try {
        const response = await fetch('/api/health', { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message ?? 'Unable to check connection.');
        if (data.status !== 'ok') throw new Error('Unexpected health response.');
        setStatus('Backend connected — status: ok');
      } catch (failure) {
        if (failure.name !== 'AbortError') {
          setError(failure.message);
          setStatus('Backend unavailable');
        }
      }
    }
    checkHealth();
    return () => controller.abort();
  }, []);

  return (
    <>
      <header><a href="/">Found Outside</a></header>
      <main>
        <p className="label">Phase 1 · Application scaffold</p>
        <h1>Premium goods.<br />Found outside.</h1>
        <p>The collection is not open yet.</p>
        <section aria-label="Application status">
          <h2>Connection status</h2>
          <p role="status">{status}</p>
          {error && <p className="error" role="alert">{error}</p>}
        </section>
      </main>
      <footer>A parody store. Nothing here is real, including the prices.</footer>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
