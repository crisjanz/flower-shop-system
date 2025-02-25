import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';

function ProductPage({ products }) {
  const [distance, setDistance] = useState(null);
  const [deliveryCost, setDeliveryCost] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const productId = window.location.pathname.split('/').pop();
  const product = products.find(p => p.id === parseInt(productId)) || {};

  useEffect(() => {
    if (!product.id) return;

    const destination = '123 Test St, Prince George, BC'; // Valid test address

    console.log('Fetching delivery distance for:', destination);
    fetch(`http://localhost:3002/api/delivery-distance?destination=${encodeURIComponent(destination)}`)
      .then(response => {
        console.log('Response received:', response);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        console.log('Delivery data:', data);
        if (data.error) {
          setFetchError(data.error + (data.details ? `: ${data.details}` : ''));
        } else {
          setDistance(data.distance);
          setDeliveryCost(data.cost);
          setFetchError(null);
        }
      })
      .catch(error => {
        console.error('Error fetching distance:', error);
        setFetchError(error.message);
      });
  }, [product.id]);

  return (
    <div className="container py-5">
      <h2>{product.name}</h2>
      <img src={product.image} alt={product.name} className="img-fluid mb-3" style={{ maxWidth: '300px' }} />
      <p>Price: ${product.price}</p>
      {fetchError ? (
        <p>Error: {fetchError}</p>
      ) : distance ? (
        <p>Delivery Distance: {distance.toFixed(2)} km</p>
      ) : (
        <p>Calculating distance...</p>
      )}
      {fetchError ? null : deliveryCost ? (
        <p>Estimated Delivery Cost: ${deliveryCost.toFixed(2)}</p>
      ) : (
        <p>Calculating cost...</p>
      )}
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  );
}

function App() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Fetching products...');
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:3002/api/products');
        console.log('Response received:', response);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        console.log('Products data:', data);
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError(error.message);
      }
    };
    fetchProducts();
  }, []);

  return (
    <Router>
      <div>
        {/* Custom Navbar */}
        <nav className="navbar navbar-expand-lg navbar-light bg-white">
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
                  <ul className="navbar-nav">
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
                  <a href="/cart">
                    <img src="/images/cart.jpg" alt="Cart" height="30" />
                  </a>
                </div>
              </div>
            </div>
            <div className="d-flex align-items-center d-md-none">
              <a href="/account">
                <img src="/images/acc.png" alt="Account" height="30" />
              </a>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route
            path="/"
            element={
              <section className="container py-5">
                <div className="row">
                  <div className="col-md-6">
                    <h1>Fresh Blooms for Every Moment</h1>
                    <p>Handcrafted bouquets, arrangements, and plants delivered to your door.</p>
                    <a href="/shop/all" className="btn btn-primary">Explore Now</a>
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
                            <h5 className="card-title">{product.name}</h5>
                            <p className="card-text">${product.price}</p>
                            <Link to={`/product/${product.id}`} className="btn btn-outline-primary">View Details</Link>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center">{error ? `Error: ${error}` : 'Loading products...'}</p>
                  )}
                </div>
              </section>
            }
          />
          <Route path="/product/:id" element={<ProductPage products={products} />} />
        </Routes>

        {/* Footer */}
        <footer className="bg-dark text-white py-4">
          <div className="container">
            <div className="row">
              <div className="col-md-4 text-center text-md-left">
                <a href="/" className="mb-3 d-inline-block">
                  <img src="/images/logo.png" alt="In Your Vase Logo" width="150" />
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
                <img src="/images/cclogos.png" alt="Accepted Payment Methods" className="img-fluid" style={{ maxWidth: '200px' }} />
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;