import { Link } from 'react-router-dom';
export const money = cents => `$${(cents / 100).toFixed(2)}`;

export function ErrorBanner({ error, retry }) {
  if (!error) return null;
  return <div className="error-banner" role="alert"><p>{error.message ?? error}</p>
    {retry && <button className="text-button" onClick={retry}>Try again</button>}</div>;
}
export function Loading({ children = 'Loading…' }) { return <p className="loading" role="status">{children}</p>; }
export function StockBadge({ stock }) {
  return <span className={`stock ${stock <= 1 ? 'stock-special' : ''}`}>
    {stock === 0 ? 'Already adopted' : stock === 1 ? 'One of a kind' : `${stock} in stock`}</span>;
}
export function QuantityStepper({ value, onChange, name = 'Quantity', disabled = false, max = 10 }) {
  return <div className="quantity" role="group" aria-label={name}>
    <button type="button" aria-label={`Decrease ${name}`} disabled={disabled || value <= 1} onClick={() => onChange(value - 1)}>−</button>
    <output aria-label={name}>{value}</output>
    <button type="button" aria-label={`Increase ${name}`} disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>+</button>
  </div>;
}
export function ProductPhoto({ product, eager = false }) {
  return <img className="product-photo" src={product.imageUrl} alt={product.imageAlt}
    width="1200" height="1500" loading={eager ? 'eager' : 'lazy'} />;
}
export function OrderSummary({ quote }) {
  return <dl className="order-summary">
    <div><dt>Subtotal</dt><dd>{money(quote.subtotalCents)}</dd></div>
    <div><dt>Heavy lifting fee</dt><dd>{money(quote.feeCents)}</dd></div>
    <div><dt>Tax ({quote.taxRatePercent}%)</dt><dd>{money(quote.taxCents)}</dd></div>
    <div className="total"><dt>Total</dt><dd>{money(quote.totalCents)}</dd></div>
  </dl>;
}
export function NotFoundPage() {
  return <section className="empty-state"><p className="eyebrow">Not in the collection</p>
    <h1>Nothing found here.<br />Not even a rock.</h1><Link className="button" to="/">Return to catalogue</Link></section>;
}
