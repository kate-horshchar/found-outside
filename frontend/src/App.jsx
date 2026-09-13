import { useEffect } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { CartProvider, useCart } from './cart.jsx';
import { ErrorBanner, NotFoundPage } from './components.jsx';
import { CatalogPage, ProductPage, CartPage, OrderConfirmationPage } from './pages.jsx';

function AppLayout() {
  const cart = useCart();
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  return <><header className="site-header"><Link className="wordmark" to="/">Found Outside<span>Objects of ordinary importance</span></Link>
    <nav aria-label="Main navigation"><NavLink to="/" end>Catalogue</NavLink><NavLink to="/cart">Cart
      {cart.count > 0 && <span className="cart-badge" aria-label={`${cart.count} items`}>{cart.count}</span>}</NavLink></nav>
  </header><main><ErrorBanner error={cart.storageError} />
    <Routes><Route path="/" element={<CatalogPage />} />
      <Route path="/products/:sku" element={<ProductPage key={location.pathname} />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/orders/:number" element={<OrderConfirmationPage />} />
      <Route path="*" element={<NotFoundPage />} /></Routes>
  </main><footer className="site-footer"><span className="footer-wordmark">Found Outside</span>
    <p>A parody store. Nothing here is real, including the prices.</p></footer></>;
}

export function App() { return <CartProvider><AppLayout /></CartProvider>; }
