import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/libre-caslon-text/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import { App } from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(<BrowserRouter><App /></BrowserRouter>);
