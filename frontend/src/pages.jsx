import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, useApi } from './api.js';
import { useCart } from './cart.jsx';
import { ErrorBanner, Loading, StockBadge, QuantityStepper, ProductPhoto, OrderSummary, NotFoundPage, money } from './components.jsx';

function IntroBanner() {
  return <section className="intro-banner">
    <img src="/banner.webp?v=3" width="2400" height="1000"
      alt="Boulderina, The Classic Stick and an Autumn Leaf on museum plinths" />
    <div className="intro-copy"><p className="eyebrow">Found Outside</p>
      <h1>Premium goods.<br />Found outside.</h1>
      <p>Rocks, sticks and other specimens, collected by hand and sold at a fair price.</p>
    </div>
  </section>;
}

function ProductCard({ product }) {
  return <article className="product-card"><Link to={`/products/${product.sku}`} state={{ fromCatalogue: true }} className="product-link">
    <ProductPhoto product={product} />
    <div className="card-heading"><span className="eyebrow">No. {product.catalogueNumber}</span><span className="price">{money(product.priceCents)}</span></div>
    <h3>{product.name}</h3>
    <p className="caption">{product.attributes.weightGrams} g · {product.attributes.sizeCm} cm · {product.attributes.foundAt}</p>
  </Link><StockBadge stock={product.stock} /></article>;
}

export function CatalogPage() {
  const [query, setQuery] = useSearchParams();
  const category = query.get('category');
  const sort = query.get('sort') ?? 'name';
  // Keep the previous grid mounted while refetching so the page height doesn't
  // collapse and the browser doesn't clamp the scroll position to the top.
  // Cache lets Back from a product render the grid at once, so scroll can be restored.
  const { data, loading, error, retry } = useApi(`/products?${query.toString()}`, undefined, { keepPrevious: true, cache: true });
  function update(name, value) {
    const next = new URLSearchParams(query);
    if (value === null) next.delete(name); else next.set(name, value);
    setQuery(next, { replace: true });
  }
  return <><IntroBanner /><section className="catalogue" aria-labelledby="collection-heading">
    <div className="section-heading"><div><p className="eyebrow">The collection</p><h2 id="collection-heading">Ordinary by nature</h2></div>
      {data && <span className="eyebrow">{data.items.length} specimens</span>}</div>
    <div className="catalogue-controls"><nav className="category-tabs" aria-label="Product category">
      {[[null, 'All'], ['rocks', 'Rocks'], ['sticks', 'Sticks'], ['tiny-things', 'Tiny Things'], ['lost-and-found', 'Lost & Found'], ['bulk', 'Bulk']].map(([slug, label]) =>
        <button type="button" key={label} aria-pressed={category === slug} onClick={() => update('category', slug)}>{label}</button>)}
    </nav><label className="sort-select">Sort by <select value={sort} onChange={event => update('sort', event.target.value)}>
      <option value="name">Name</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option>
    </select></label></div>
    <ErrorBanner error={error} retry={retry} />
    {loading && !data && <Loading>Loading the collection…</Loading>}
    {data && <div className="product-grid" aria-busy={loading}>{data.items.map(product => <ProductCard key={product.sku} product={product} />)}</div>}
    {!loading && data?.items.length === 0 && <p className="loading">No specimens in this selection</p>}
  </section></>;
}

export function ProductPage() {
  const { sku } = useParams();
  const { data: product, loading, error, retry } = useApi(`/products/${encodeURIComponent(sku)}`);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const cart = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  // Opened from the catalogue: go back in history to keep its filters and scroll position.
  // Opened directly (new tab, shared link): there is no catalogue entry, so link to it.
  function backToCatalogue(event) {
    if (!location.state?.fromCatalogue || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(-1);
  }
  if (loading) return <Loading>Loading specimen…</Loading>;
  if (error) return <><ErrorBanner error={error} retry={error.status === 404 ? undefined : retry} />{error.status === 404 && <NotFoundPage />}</>;
  // Per-line limit is min(10, stock); the 10 cap is a UI convention, stock is enforced by the API.
  const limit = Math.min(10, product.stock);
  const inCart = Array.isArray(cart.items) ? cart.items.find(item => item?.sku === product.sku)?.qty : 0;
  const available = Math.max(0, limit - (Number.isInteger(inCart) ? inCart : 0));
  const selected = Math.min(qty, Math.max(1, available));
  return <><Link className="back-link" to="/" onClick={backToCatalogue}>← Catalogue</Link><article className="product-detail">
    <ProductPhoto product={product} eager />
    <div className="product-information"><p className="eyebrow">No. {product.catalogueNumber} / {product.category.replace('-', ' ')}</p>
      <h1>{product.name}</h1><StockBadge stock={product.stock} />
      <blockquote>{product.tagline}</blockquote><p className="description">{product.description}</p>
      <dl className="spec-sheet">{[['Weight', `${product.attributes.weightGrams} g`], ['Size', `${product.attributes.sizeCm} cm`],
        ['Color', product.attributes.color], ['Found at', product.attributes.foundAt]].map(([label, value]) =>
        <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <div className="purchase"><span className="detail-price">{money(product.priceCents)}</span>
        <QuantityStepper value={selected} max={Math.max(1, available)} disabled={available === 0}
          onChange={value => { setQty(value); setAdded(false); }} />
        <button className="button" disabled={available === 0} onClick={() => { cart.add(product.sku, selected, limit); setAdded(true); }}>
          {product.stock === 0 ? 'Already adopted' : 'Add to cart'}</button></div>
      {added && <p className="success" role="status">Added to cart. <Link to="/cart">View cart →</Link></p>}
      {!added && product.stock > 0 && available === 0 && <p className="purchase-note">
        {product.stock === 1 ? 'Already in your cart' : product.stock <= 10 ? 'All available specimens are in your cart' : 'Limit 10 per order reached'}</p>}
    </div></article></>;
}

export function CartPage() {
  const cart = useCart();
  const empty = Array.isArray(cart.items) && cart.items.length === 0;
  const { data: quote, loading, error, retry } = useApi(empty ? null : '/quote', { items: cart.items });
  // A line above current stock would be rejected by the order API; the line warnings let the visitor fix it first.
  const overStock = quote?.lines.some(line => line.qty > line.stock) ?? false;
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState(null);
  async function checkout(event) {
    event.preventDefault();
    if (submitting || loading || error || !quote || overStock) return;
    setSubmitting(true); setOrderError(null);
    try {
      const order = await api('/orders', { body: { customer: { name, email }, items: cart.items } });
      cart.clear(); navigate(`/orders/${order.number}`);
    } catch (failure) { setOrderError(failure); setSubmitting(false); }
  }
  function change(sku, qty) { setOrderError(null); cart.change(sku, qty); }
  if (empty) return <section className="empty-state"><p className="eyebrow">Your collection</p>
    <h1>Your cart is empty.<br />Nature is not.</h1><Link className="button" to="/">Return to catalogue</Link></section>;
  return <><div className="page-heading"><p className="eyebrow">Your collection</p><h1>Cart & adoption</h1></div>
    <ErrorBanner error={error} retry={error?.code === 'VALIDATION_FAILED' ? undefined : retry} /><ErrorBanner error={orderError} />
    {error?.code === 'VALIDATION_FAILED' && <button className="button" onClick={cart.clear}>Clear cart</button>}
    {loading && <Loading>Updating your quote…</Loading>}
    <div className="cart-layout"><section aria-label="Cart items">
      {quote?.lines.map(line => <article className="cart-line" key={line.sku}>
        <div><Link to={`/products/${line.sku}`}><h2>{line.name}</h2></Link><span className="caption">{money(line.unitPriceCents)} each</span>
          {line.qty > line.stock && <span className="stock-warning">{line.stock === 0 ? 'No longer available' : `Only ${line.stock} left`}</span>}</div>
        <QuantityStepper name={`quantity for ${line.name}`} value={line.qty} max={Math.max(1, Math.min(10, line.stock))}
          onChange={qty => change(line.sku, qty)} disabled={submitting} />
        <span className="price">{money(line.lineTotalCents)}</span>
        <button className="text-button remove" disabled={submitting} onClick={() => { setOrderError(null); cart.remove(line.sku); }}>Remove</button>
      </article>)}<Link className="back-link" to="/">← Continue browsing</Link>
    </section><aside className="checkout-panel"><h2>Adoption details</h2>{quote && <OrderSummary quote={quote} />}
      <form noValidate onSubmit={checkout}>
        <label htmlFor="customer-name">Name</label><input id="customer-name" name="name" autoComplete="name" value={name}
          disabled={submitting} onChange={event => setName(event.target.value)} />
        <label htmlFor="customer-email">Email</label><input id="customer-email" name="email" type="email" autoComplete="email" value={email}
          disabled={submitting} onChange={event => setEmail(event.target.value)} />
        <button className="button" type="submit" disabled={submitting || loading || !!error || !quote || overStock}>
          {submitting ? 'Completing adoption…' : 'Complete adoption'}</button>
      </form><p className="caption">No payment is collected. This is a parody store.</p>
    </aside></div></>;
}

export function OrderConfirmationPage() {
  const { number } = useParams();
  const { data: order, loading, error, retry } = useApi(`/orders/${encodeURIComponent(number)}`);
  if (loading) return <Loading>Loading adoption…</Loading>;
  if (error) return <><ErrorBanner error={error} retry={error.status === 404 ? undefined : retry} />{error.status === 404 && <NotFoundPage />}</>;
  return <section className="confirmation"><p className="eyebrow">Order #{order.number}</p>
    <h1>Adoption complete</h1><p className="confirmation-name">Thank you, {order.customerName}.</p>
    <div className="confirmation-lines">{order.lines.map(line => <div key={line.sku}>
      <span>{line.name} <span className="caption">× {line.qty}</span></span><span className="price">{money(line.lineTotalCents)}</span>
    </div>)}</div><OrderSummary quote={order} /><Link className="button" to="/">Continue browsing</Link></section>;
}
