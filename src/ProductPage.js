import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function ProductPage({ products, addToCart }) {
  const [deliveryCost, setDeliveryCost] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [postalCode, setPostalCode] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('Medium');
  const [upsellQuantities, setUpsellQuantities] = useState({});
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [showPolicy, setShowPolicy] = useState(false);
  const [cardMessage, setCardMessage] = useState('');
  const [isDelivery, setIsDelivery] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [addedItem, setAddedItem] = useState(null);
  const maxChars = 250;

  const productId = window.location.pathname.split('/').pop();
  const product = products.find(p => p.id === parseInt(productId)) || {};

  const productImages = [product.image, '/images/cloth_2.jpg', '/images/cloth_3.jpg'];
  const upsellItems = [
    { id: 4, name: 'Mini Vase', price: 10, image: '/images/cloth_1.jpg' },
    { id: 5, name: 'Flower Food', price: 5, image: '/images/cloth_2.jpg' },
    { id: 6, name: 'Gift Card', price: 15, image: '/images/cloth_3.jpg' },
  ];

  const basePrice = parseFloat(product.price) || 0;
  const sizes = [
    { size: 'Small', price: basePrice * 0.8 },
    { size: 'Medium', price: basePrice },
    { size: 'Large', price: basePrice * 1.2 },
  ];

  const selectedSizePrice = sizes.find(s => s.size === selectedSize)?.price || basePrice;
  const upsellTotal = upsellItems.reduce((total, item) => total + (upsellQuantities[item.id] || 0) * item.price, 0);

  const calculateDistance = async () => {
    if (!isDelivery) {
      setDeliveryCost(0);
      setFetchError(null);
      console.log('Set to pickup: deliveryCost=0, fetchError=null');
      return;
    }
    if (!postalCode) {
      setFetchError('Please enter a postal code');
      console.log('No postal code: fetchError="Please enter a postal code"');
      return;
    }
    try {
      const destination = `${postalCode}, Prince George, BC`;
      const response = await fetch(`http://localhost:3002/api/delivery-distance?destination=${encodeURIComponent(destination)}`);
      const data = await response.json();
      console.log('Backend response:', data);
      if (!response.ok) {
        setFetchError(
          data.error === 'Out of delivery area' ? 'Sorry, this location is outside our delivery area.' :
          data.error === 'Invalid postal code' ? 'Invalid postal code—please check and try again.' :
          `${data.error}${data.details ? `: ${data.details}` : ''}`
        );
        setDeliveryCost(null);
        console.log('Error set: fetchError=', data.error, 'deliveryCost=null');
      } else {
        setDeliveryCost(data.cost);
        setFetchError(null);
        console.log('Cost set: deliveryCost=', data.cost, 'fetchError=null');
      }
    } catch (error) {
      console.error('Distance fetch error:', error);
      setFetchError(error.message);
      console.log('Fetch error: fetchError=', error.message);
    }
  };

  // Debounce function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Debounced calculateDistance
  const debouncedCalculateDistance = useCallback(debounce(calculateDistance, 1000), [postalCode, isDelivery]);

  const handlePostalCodeChange = (e) => {
    const value = e.target.value;
    setPostalCode(value);
    if (deliveryCost !== null || fetchError !== null) {
      setDeliveryCost(null);
      setFetchError(null);
    }
  };

  // Auto-calculate when postalCode changes
  useEffect(() => {
    const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][\s]?\d[A-Za-z]\d$/;
    const cleanValue = postalCode.replace(/\s/g, '');
    if (cleanValue.length === 6 && postalCodeRegex.test(postalCode)) {
      debouncedCalculateDistance();
    }
  }, [postalCode, isDelivery, debouncedCalculateDistance]);

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);

  const handleUpsellQtyChange = (itemId, qty) => {
    setUpsellQuantities(prev => ({ ...prev, [itemId]: Math.max(0, qty) }));
  };

  const handleAddToCart = () => {
    const cartItem = {
      productId: product.id,
      name: product.name,
      size: selectedSize,
      price: selectedSizePrice,
      image: product.image || '/images/default.jpg',
      upsells: upsellItems.filter(item => upsellQuantities[item.id] > 0).map(item => ({
        name: item.name,
        price: item.price,
        quantity: upsellQuantities[item.id]
      })),
      deliveryCost: isDelivery ? (deliveryCost || 0) : 0,
      postalCode: isDelivery ? postalCode : null,
      cardMessage,
      deliveryDate: deliveryDate ? deliveryDate.toISOString() : null,
      isDelivery,
      quantity: 1,
    };
    addToCart(cartItem);
    setAddedItem(cartItem);
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  return (
    <div className="container py-5">
      <div className="product-grid mb-4">
        <div className="product-image">
          <img
            src={productImages[currentImageIndex]}
            alt={product.name}
            className="img-fluid"
            style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover' }}
          />
          <div className="d-flex justify-content-center align-items-center mt-2 gap-2">
            <button
              className="btn btn-outline-secondary rounded-circle"
              style={{ backgroundColor: 'white', borderColor: '#edafb8', width: '30px', height: '30px', padding: '0', color: '#edafb8' }}
              onClick={prevImage}
            >
              ←
            </button>
            {productImages.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`${product.name} ${index + 1}`}
                className="img-thumbnail"
                style={{ width: '60px', height: '60px', cursor: 'pointer', objectFit: 'cover', border: currentImageIndex === index ? '2px solid #edafb8' : 'none' }}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
            <button
              className="btn btn-outline-secondary rounded-circle"
              style={{ backgroundColor: 'white', borderColor: '#edafb8', width: '30px', height: '30px', padding: '0', color: '#edafb8' }}
              onClick={nextImage}
            >
              →
            </button>
          </div>
        </div>
        <div className="product-content">
          <div className="title-price mb-3">
            <h2 className="text-left">{product.name}</h2>
            <p className="price fw-bold mb-0" style={{ fontSize: '1.5rem' }}>${selectedSizePrice.toFixed(2)}</p>
          </div>
          <div className="mb-3">
            <div className="d-flex gap-2 flex-wrap">
              {sizes.map(option => (
                <button
                  key={option.size}
                  className={`btn ${selectedSize === option.size ? 'btn-primary' : 'btn-outline-primary'}`}
                  style={{ backgroundColor: selectedSize === option.size ? '#edafb8' : 'transparent', borderColor: '#edafb8', color: selectedSize === option.size ? '#fff' : '#edafb8' }}
                  onClick={() => setSelectedSize(option.size)}
                >
                  ${option.price.toFixed(2)}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-3">A beautiful arrangement crafted with fresh, hand-picked flowers—perfect for any occasion.</p>
          <hr className="my-3" />
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <label htmlFor="cardMessage" className="form-label">Card Message:</label>
              <span style={{ fontFamily: 'Avenir, sans-serif', fontSize: '15px' }}>
                {maxChars - cardMessage.length}/{maxChars}
              </span>
            </div>
            <textarea
              id="cardMessage"
              className="form-control"
              rows="3"
              placeholder="Enter your message..."
              value={cardMessage}
              onChange={(e) => setCardMessage(e.target.value.slice(0, maxChars))}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Delivery or Pickup:</label>
            <div className="d-flex gap-2 mb-2">
              <button
                className={`btn ${isDelivery ? 'btn-primary' : 'btn-outline-primary'}`}
                style={{ backgroundColor: isDelivery ? '#edafb8' : 'transparent', borderColor: '#edafb8', color: isDelivery ? '#fff' : '#edafb8' }}
                onClick={() => { setIsDelivery(true); setDeliveryCost(null); setFetchError(null); }}
              >
                Delivery
              </button>
              <button
                className={`btn ${!isDelivery ? 'btn-primary' : 'btn-outline-primary'}`}
                style={{ backgroundColor: !isDelivery ? '#edafb8' : 'transparent', borderColor: '#edafb8', color: !isDelivery ? '#fff' : '#edafb8' }}
                onClick={() => { setIsDelivery(false); setDeliveryCost(0); setFetchError(null); }}
              >
                Pickup
              </button>
            </div>
            {isDelivery && (
              <div className="mb-1">
                <label htmlFor="postalCode" className="form-label">Delivery Postal Code:</label>
                <div className="input-group" style={{ width: '300px' }}>
                  <input
                    type="text"
                    id="postalCode"
                    className="form-control"
                    value={postalCode}
                    onChange={handlePostalCodeChange}
                    placeholder="e.g., V2N 1X1"
                  />
                </div>
                {fetchError ? (
                  <p className="text-danger mt-2">Error: {fetchError}</p>
                ) : deliveryCost !== null ? (
                  <p className="mt-2">Estimated Delivery Cost: ${deliveryCost.toFixed(2)}</p>
                ) : (
                  <p className="mt-2">Enter postal code to calculate...</p>
                )}
              </div>
            )}
          </div>
          <div className="mb-3">
            <label htmlFor="deliveryDate" className="form-label">Delivery/Pickup Date:</label>
            <div className="input-group" style={{ width: '300px' }}>
              <DatePicker
                selected={deliveryDate}
                onChange={(date) => setDeliveryDate(date)}
                className="form-control datepicker-fixed"
                placeholderText="Select date"
                dateFormat="yyyy-MM-dd"
              />
              <span
                className="input-group-text"
                style={{ backgroundColor: '#edafb8', borderColor: '#edafb8', padding: '5px' }}
              >
                <img src="/images/cal.png" alt="Calendar" style={{ width: '30px', height: '30px' }} />
              </span>
            </div>
          </div>
          <div className="mb-4 mt-4" style={{ border: '1px solid #ced4da', borderRadius: '5px', padding: '15px' }}>
            <h3 className="mb-3" style={{ fontSize: '1.25rem' }}>Add Something Special</h3>
            <div className="d-flex gap-4 flex-wrap justify-content-center">
              {upsellItems.map(item => (
                <div key={item.id} className="text-center">
                  <img src={item.image} alt={item.name} className="img-fluid mb-2" style={{ maxWidth: '100px' }} />
                  <p className="mb-1">{item.name}</p>
                  <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                    <p className="fw-bold mb-0">${item.price} x</p>
                    <div className="d-flex align-items-center gap-1">
                      <span>{upsellQuantities[item.id] || 0}</span>
                      <div className="d-flex flex-column">
                        <button
                          className="btn p-0"
                          style={{ background: 'none', border: 'none' }}
                          onClick={() => handleUpsellQtyChange(item.id, (upsellQuantities[item.id] || 0) + 1)}
                        >
                          <img src="/images/up.png" alt="Up" style={{ width: '15px', height: '15px' }} />
                        </button>
                        <button
                          className="btn p-0"
                          style={{ background: 'none', border: 'none' }}
                          onClick={() => handleUpsellQtyChange(item.id, (upsellQuantities[item.id] || 0) - 1)}
                        >
                          <img src="/images/down.png" alt="Down" style={{ width: '15px', height: '15px' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ minHeight: '120px', transition: 'all 0.3s ease' }}>
            <button 
              className="btn btn-primary btn-lg w-100" 
              style={{ backgroundColor: '#edafb8', borderColor: '#edafb8' }} 
              onClick={handleAddToCart}
            >
              Add to Cart
            </button>
            {(upsellTotal > 0 || (isDelivery && deliveryCost !== null)) && (
              <div className="mt-3 text-left" style={{ fontSize: '0.9rem', lineHeight: '1.2' }}>
                <div className="d-flex justify-content-between">
                  <span>{product.name}</span>
                  <span>${selectedSizePrice.toFixed(2)}</span>
                </div>
                {upsellItems.map(item => (
                  upsellQuantities[item.id] > 0 && (
                    <div key={item.id} className="d-flex justify-content-between">
                      <span>{item.name}</span>
                      <span>${(item.price * upsellQuantities[item.id]).toFixed(2)}</span>
                    </div>
                  )
                ))}
                {isDelivery && deliveryCost !== null && (
                  <div className="d-flex justify-content-between">
                    <span>Delivery</span>
                    <span>${deliveryCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between">
                  <strong>Total</strong>
                  <strong>${(selectedSizePrice + upsellTotal + (isDelivery ? (deliveryCost || 0) : 0)).toFixed(2)}</strong>
                </div>
              </div>
            )}
          </div>
          <div className="mt-3">
            <h4
              style={{ cursor: 'pointer', fontSize: '1rem' }}
              onClick={() => setShowPolicy(!showPolicy)}
            >
              Delivery and Substitution Policy
            </h4>
            {showPolicy && (
              <p className="mt-2" style={{ transition: 'all 0.3s ease' }}>
                We strive to deliver your order on time. Delivery times may vary based on availability and location. Substitution may occur if a specific flower is unavailable; we’ll replace it with a similar item of equal or greater value to ensure your arrangement remains stunning.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bootstrap Modal for Popup */}
      {addedItem && (
        <div className={`modal fade ${showModal ? 'show d-block' : 'd-none'}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: '#f8f9fa', borderBottom: 'none' }}>
                <h5 className="modal-title" style={{ fontSize: '1.5rem' }}>Item Added to Cart!</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  aria-label="Close"
                  style={{ backgroundColor: '#edafb8', width: '20px', height: '20px' }}
                ></button>
              </div>
              <div className="modal-body">
                <p>{addedItem.name} ({addedItem.size}) has been added to your cart.</p>
              </div>
              <div className="modal-footer" style={{ borderTop: 'none' }}>
                <Link
                  to="/cart"
                  className="btn btn-primary"
                  style={{ backgroundColor: '#edafb8', borderColor: '#edafb8' }}
                  onClick={handleCloseModal}
                >
                  Go to Cart
                </Link>
                <Link
                  to="/shop/gifts"
                  className="btn btn-outline-primary custom-outline-btn"
                  style={{ borderColor: '#edafb8', color: '#edafb8' }}
                  onClick={handleCloseModal}
                >
                  Add Gifts
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductPage;