import { createContext, useContext, useState } from 'react';

const KEY = 'found-outside-cart';
const CartContext = createContext(null);
function loadCart() {
  try { const saved = localStorage.getItem(KEY); return saved === null ? [] : JSON.parse(saved); }
  catch { return null; } // Send invalid storage to the API for VALIDATION_FAILED.
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const [storageError, setStorageError] = useState('');
  function save(next) {
    try { localStorage.setItem(KEY, JSON.stringify(next)); setStorageError(''); }
    catch { setStorageError('Your browser could not save the cart. Keep this page open to retain it.'); }
    setItems(next);
  }
  // `max` is the per-line limit: min(10, stock) from the product page.
  function add(sku, qty, max = 10) {
    const current = Array.isArray(items) ? items : [];
    const found = current.find(item => item?.sku === sku);
    if (found) save(current.map(item => item?.sku === sku
      ? { sku, qty: Math.min(max, (Number.isInteger(item.qty) ? item.qty : 0) + qty) } : item));
    else save([...current, { sku, qty: Math.min(max, qty) }]);
  }
  const count = Array.isArray(items) ? items.reduce((sum, item) =>
    sum + (Number.isInteger(item?.qty) && item.qty > 0 ? item.qty : 0), 0) : 0;
  return <CartContext.Provider value={{ items, count, add, storageError,
    clear: () => save([]),
    change: (sku, qty) => save(items.map(item => item.sku === sku ? { sku, qty } : item)),
    remove: sku => save(items.filter(item => item.sku !== sku)),
  }}>{children}</CartContext.Provider>;
}
export const useCart = () => useContext(CartContext);
