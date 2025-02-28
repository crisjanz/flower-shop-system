import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import ProductPage from './ProductPage';
import CategoryPage from './CategoryPage';
import CartPage from './CartPage';
import CheckoutPage from './CheckoutPage';
import 'bootstrap/dist/css/bootstrap.min.css';

const stripePromise = loadStripe('YOUR_PK_TEST_KEY_HERE'); // Replace with your pk_test_...

function App() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [guestId] = useState(() => {
    let id = localStorage.getItem('guestId');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('guestId', id);
    }
    return id;
  });
  const [isDelivery, setIsDelivery] = useState(null); // null until first item

  useEffect(() => {
    console.log('Fetching products...');
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:3002/api/products');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError(error.message);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await fetch(`http://localhost:3002/api/cart?guest_id=${guestId}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        console.log('Fetched cart:', data);
        setCart(data);
        if (data.length > 0 && isDelivery === null) {
          setIsDelivery(data[0].isDelivery); // Set session delivery type
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    };
    fetchCart();
  }, [guestId]);

  const addToCart = async (item) => {
    if (cart.length > 0 && item.isDelivery !== isDelivery) {
      alert(`You can only add ${isDelivery ? 'delivery' : 'pickup'} items to this cart. Please clear your cart to switch delivery type.`);
      return;
    }
    try {
      const response = await fetch('http://localhost:3002/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_id: guestId, item })
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const updatedCart = await fetch(`http://localhost:3002/api/cart?guest_id=${guestId}`);
      const updatedData = await updatedCart.json();
      setCart(updatedData);
      if (isDelivery === null) {
        setIsDelivery(item.isDelivery); // Lock session type
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const removeFromCart = async (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    try {
      const response = await fetch('http://localhost:3002/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_id: guestId, item: newCart })
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const updatedCart = await fetch(`http://localhost:3002/api/cart?guest_id=${guestId}`);
      const updatedData = await updatedCart.json();
      setCart(updatedData);
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const updateCartQuantity = async (index, newQuantity) => {
    const newCart = [...cart];
    newCart[index].quantity = newQuantity;
    try {
      const response = await fetch('http://localhost:3002/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_id: guestId, item: newCart })
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const updatedCart = await fetch(`http://localhost:3002/api/cart?guest_id=${guestId}`);
      const updatedData = await updatedCart.json();
      setCart(updatedData);
    } catch (error) {
      console.error('Error updating cart quantity:', error);
    }
  };

  const removeUpsell = async (cartIndex, upsellIndex) => {
    const newCart = [...cart];
    newCart[cartIndex].upsells.splice(upsellIndex, 1);
    try {
      const response = await fetch('http://localhost:3002/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_id: guestId, item: newCart })
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const updatedCart = await fetch(`http://localhost:3002/api/cart?guest_id=${guestId}`);
      const updatedData = await updatedCart.json();
      setCart(updatedData);
    } catch (error) {
      console.error('Error removing upsell:', error);
    }
  };

  const updateUpsellQuantity = async (cartIndex, upsellIndex, newQuantity) => {
    const newCart = [...cart];
    newCart[cartIndex].upsells[upsellIndex].quantity = newQuantity;
    try {
      const response = await fetch('http://localhost:3002/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_id: guestId, item: newCart })
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const updatedCart = await fetch(`http://localhost:3002/api/cart?guest_id=${guestId}`);
      const updatedData = await updatedCart.json();
      setCart(updatedData);
    } catch (error) {
      console.error('Error updating upsell quantity:', error);
    }
  };

  const clearCart = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_id: guestId, item: [] })
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const updatedCart = await fetch(`http://localhost:3002/api/cart?guest_id=${guestId}`);
      const updatedData = await updatedCart.json();
      setCart(updatedData);
      setIsDelivery(null); // Reset delivery type
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const buttonStyles = `
    .custom-outline-btn:hover {
      background-color: #edafb8 !important;
      color: #fff !important;
      border-color: #edafb8 !important;
    }
  `;

  return (
    <Router>
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: 'Avenir, sans-serif', fontSize: '15px' }}>
        <style>{buttonStyles}</style>
        <nav className="navbar navbar-expand-lg navbar-light bg-white" style={{ backgroundColor: '#fff !important' }}>
          <div className="container-fluid">
            <div className="d-block d-md-none">
              <button
                className="btn btn-outline-secondary me-2"
                type="button"
                data-bs-toggle="offcanvas"
                data-bs-target="#sidebarMenu"
                aria-controls="sidebarMenu"
              >
                <span className="navbar-toggler-icon"></span>
              </button>
              <div
                className="offcanvas offcanvas-start"
                tabIndex="-1"
                id="sidebarMenu"
                aria-labelledby="sidebarMenuLabel"
              >
                <div className="offcanvas-header">
                  <h5 className="offcanvas-title" id="sidebarMenuLabel">In Your Vase</h5>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="offcanvas"
                    aria-label="Close"
                  ></button>
                </div>
                <div className="offcanvas-body">
                  <ul className="nav flex-column">
                    <li className="nav-item">
                      <a className="nav-link" href="/">Home</a>
                    </li>
                    <li className="nav-item dropdown">
                      <button
                        className="nav-link dropdown-toggle"
                        id="shopDropdown"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        Shop
                      </button>
                      <div className="dropdown-menu" aria-labelledby="shopDropdown">
                        <a className="dropdown-item" href="/shop/bouquets">Bouquets</a>
                        <a className="dropdown-item" href="/shop/arrangements">Arrangements</a>
                        <a className="dropdown-item" href="/shop/plants">Plants</a>
                      </div>
                    </li>
                    <li className="nav-item">
                      <a className="nav-link" href="/wedding">Wedding Flowers</a>
                    </li>
                    <li className="nav-item">
                      <a className="nav-link" href="/contact">Contact</a>
                    </li>
                  </ul>
                  <form className="mt-3">
                    <input
                      className="form-control"
                      type="search"
                      placeholder="Search flowers..."
                      aria-label="Search"
                      style={{ width: '100%' }}
                    />
                  </form>
                </div>
              </div>
            </div>
            <div className="d-flex justify-content-center flex-grow-1 d-md-none">
              <a className="navbar-brand" href="/">
                <img src="/images/logo.png" alt="In Your Vase Logo" width="350" className="logo-img" />
              </a>
            </div>
            <div className="row w-100 align-items-center d-none d-md-flex">
              <div className="col d-flex justify-content-center">
                <form className="d-flex align-items-center">
                  <input
                    className="form-control me-2"
                    type="search"
                    placeholder="Search flowers..."
                    aria-label="Search"
                    style={{ width: '200px' }}
                  />
                </form>
              </div>
              <div className="col d-flex flex-column align-items-center">
                <a className="navbar-brand" href="/">
                  <img src="/images/logo.png" alt="In Your Vase Logo" width="350" className="logo-img" />
                </a>
                <div className="navbar-collapse justify-content-center" id="navbarNavDesktop">
                  <ul className="navbar-nav flex-row">
                    <li className="nav-item">
                      <a className="nav-link" href="/">Home</a>
                    </li>
                    <li className="nav-item dropdown">
                      <button
                        className="nav-link dropdown-toggle"
                        id="shopDropdownDesktop"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        Shop
                      </button>
                      <div className="dropdown-menu" aria-labelledby="shopDropdownDesktop">
                        <a className="dropdown-item" href="/shop/bouquets">Bouquets</a>
                        <a className="dropdown-item" href="/shop/arrangements">Arrangements</a>
                        <a className="dropdown-item" href="/shop/plants">Plants</a>
                      </div>
                    </li>
                    <li className="nav-item">
                      <a className="nav-link" href="/wedding">Wedding Flowers</a>
                    </li>
                    <li className="nav-item">
                      <a className="nav-link" href="/contact">Contact</a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col d-flex justify-content-center">
                <div className="d-flex align-items-center">
                  <a href="/account" className="me-2">
                    <img src="/images/acc.png" alt="Account" height="30" />
                  </a>
                  <Link to="/cart">
                    <img src="/images/cart.jpg" alt="Cart" height="30" />
                    {cart.length > 0 && <span className="badge bg-danger">{cart.length}</span>}
                  </Link>
                </div>
              </div>
            </div>
            <div className="d-flex align-items-center d-md-none">
              <Link to="/cart">
                <img src="/images/cart.jpg" alt="Cart" height="30" />
                {cart.length > 0 && <span className="badge bg-danger">{cart.length}</span>}
              </Link>
            </div>
          </div>
        </nav>

        <Elements stripe={stripePromise}>
          <Routes>
            <Route
              path="/"
              element={
                <section className="container py-5">
                  <div className="row">
                    <div className="col-md-6">
                      <h1 style={{ fontSize: '1.5rem' }}>Fresh Blooms for Every Moment</h1>
                      <p>Handcrafted bouquets, arrangements, and plants delivered to your door.</p>
                      <a href="/shop/all" className="btn btn-primary" style={{ backgroundColor: '#edafb8', borderColor: '#edafb8' }}>Explore Now</a>
                    </div>
                    <div className="col-md-6">
                      <img src="/images/hero_1.jpg" alt="Featured Arrangement" className="img-fluid" />
                    </div>
                  </div>
                  <h2 className="text-center mb-4 mt-5">Featured Favorites</h2>
                  <div className="row">
                    {products.length > 0 ? (
                      products.map(product => (
                        <div className="col-md-4 mb-4" key={product.id}>
                          <div className="card">
                            <img src={product.image} alt={product.name} className="card-img-top" />
                            <div className="card-body">
                              <h5 className="card-title" style={{ fontSize: '1.5rem' }}>{product.name}</h5>
                              <p className="card-text" style={{ fontSize: '1.5rem' }}>${product.price}</p>
                              <Link
                                to={`/product/${product.id}`}
                                className="btn btn-outline-primary custom-outline-btn"
                                style={{ borderColor: '#edafb8', color: '#edafb8' }}
                              >
                                View Details
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : error ? (
                      <p className="text-center text-danger">Error: {error}</p>
                    ) : (
                      <p className="text-center">Loading products...</p>
                    )}
                  </div>
                </section>
              }
            />
            <Route path="/product/:id" element={<ProductPage products={products} addToCart={addToCart} />} />
            <Route path="/shop/:category" element={<CategoryPage products={products} />} />
            <Route path="/cart" element={<CartPage cart={cart} removeFromCart={removeFromCart} clearCart={clearCart} updateCartQuantity={updateCartQuantity} removeUpsell={removeUpsell} updateUpsellQuantity={updateUpsellQuantity} />} />
            <Route path="/checkout" element={<CheckoutPage cart={cart} clearCart={clearCart} />} />
          </Routes>
        </Elements>

        <footer className="bg-dark text-white py-4">
          <div className="container">
            <div className="row">
              <div className="col-md-4 text-center text-md-left">
                <a href="/" className="mb-3 d-inline-block">
                  <img src="/images/logo-inv.png" alt="In Your Vase Logo" width="200" />
                </a>
                <p>© 2025 In Your Vase. All rights reserved.</p>
              </div>
              <div className="col-md-4 text-center">
                <h5 className="mb-3">Quick Links</h5>
                <ul className="list-unstyled">
                  <li><a href="/shop/all" className="text-white text-decoration-none">Shop</a></li>
                  <li><a href="/wedding" className="text-white text-decoration-none">Weddings</a></li>
                  <li><a href="/contact" className="text-white text-decoration-none">Contact</a></li>
                </ul>
              </div>
              <div className="col-md-4 text-center text-md-right">
                <h5 className="mb-3">Store Hours</h5>
                <p>Mon-Fri: 9 AM - 6 PM<br />Sat: 10 AM - 4 PM<br />Sun: Closed</p>
              </div>
            </div>
            <div className="row mt-3">
              <div className="col text-center">
                <p>Accepted Payment methods</p>
                <img src="/images/cclogos.png" alt="Accepted Payment Methods" className="img-fluid" style={{ maxWidth: '300px' }} />
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;