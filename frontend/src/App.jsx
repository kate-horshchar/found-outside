import { useLayoutEffect, useRef } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { CartProvider, useCart } from './cart.jsx';
import { ErrorBanner, NotFoundPage } from './components.jsx';
import { CatalogPage, ProductPage, CartPage, OrderConfirmationPage } from './pages.jsx';

// Scroll position per history entry (location.key). We restore it ourselves, so the
// browser must not try to restore scroll before the new page has rendered.
const scrollPositions = new Map();
if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';

function useScrollMemory(location) {
  const navigationType = useNavigationType();
  const previousPathname = useRef(null);
  useLayoutEffect(() => {
    const pathnameChanged = previousPathname.current !== location.pathname;
    previousPathname.current = location.pathname;
    // Back/Forward returns to the saved position; a new page starts at the top;
    // query-only changes (catalogue filters) keep the current position.
    if (navigationType === 'POP') window.scrollTo(0, scrollPositions.get(location.key) ?? 0);
    else if (pathnameChanged) window.scrollTo(0, 0);
    const save = () => scrollPositions.set(location.key, window.scrollY);
    if (navigationType !== 'POP') save();
    // Layout-effect cleanup detaches before the browser dispatches the scroll event caused
    // by the next page's height change, so that clamp is never saved for this entry.
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, [location.key]);
}

function AppLayout() {
  const cart = useCart();
  const location = useLocation();
  useScrollMemory(location);
  return <><header className="site-header"><Link className="wordmark" to="/">Found Outside<span>Objects of ordinary importance</span></Link>
    <nav aria-label="Main navigation"><NavLink to="/" end>Catalogue</NavLink><NavLink to="/cart">Cart
      {cart.count > 0 && <span className="cart-badge" aria-label={`${cart.count} items`}>{cart.count}</span>}</NavLink></nav>
  </header><main><ErrorBanner error={cart.storageError} />
    <Routes><Route path="/" element={<CatalogPage />} />
      <Route path="/products/:sku" element={<ProductPage key={location.pathname} />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/orders/:number" element={<OrderConfirmationPage />} />
      <Route path="*" element={<NotFoundPage />} /></Routes>
  </main><footer className="site-footer"><div className="footer-brand">
    <span className="footer-wordmark">Found Outside</span>
    <span className="footer-tagline">Objects of ordinary importance.</span>
  </div><p className="footer-note">Established somewhere outdoors.<br />Nothing here is real, including the prices.</p></footer></>;
}

export function App() { return <CartProvider><AppLayout /></CartProvider>; }
