import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function CartPage({ cart, removeFromCart, clearCart, updateCartQuantity, removeUpsell, updateUpsellQuantity }) {
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => {
    const upsellSum = item.upsells.reduce((s, u) => s + u.price * u.quantity, 0);
    return sum + item.price + upsellSum + (item.isDelivery ? item.deliveryCost || 0 : 0);
  }, 0);

  const handleUpsellQtyChange = (cartIndex, upsellIndex, change) => {
    const currentQty = cart[cartIndex].upsells[upsellIndex].quantity;
    const newQuantity = Math.max(0, currentQty + change);
    if (newQuantity === 0) {
      removeUpsell(cartIndex, upsellIndex);
    } else {
      updateUpsellQuantity(cartIndex, upsellIndex, newQuantity);
    }
  };

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      clearCart();
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  if (cart.length === 0) {
    return (
      <section className="container py-5">
        <h2 className="text-center mb-4">Your Cart</h2>
        <div className="text-center">
          <p>Your cart is empty.</p>
          <Link to="/shop/all" className="btn btn-primary" style={{ backgroundColor: '#edafb8', borderColor: '#edafb8', color: '#fff' }}>
            Shop Now
          </Link>
        </div>
      </section>
    );
  }

  const isDelivery = cart[0].isDelivery;

  return (
    <section className="container py-5">
      <h2 className="text-center mb-4">Your Order</h2>
      <div className="row justify-content-center">
        <div className="col-md-12">
          <div className="card p-3 cart-page-card" style={{ width: '95%', margin: '0 auto' }}>
            <div className="row">
              <div className="col-12">
                <div className="d-flex flex-column">
                  <div className="mb-3">
                    <span
                      style={{
                        backgroundColor: '#edafb8',
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        display: 'inline-block',
                        marginBottom: '5px',
                      }}
                    >
                      {isDelivery ? "Delivery" : "Pickup"}
                    </span>
                    {cart.map((item, cartIndex) => (
                      <div
                        key={cartIndex}
                        className="mb-3 d-flex align-items-start flex-column flex-md-row"
                        style={{ gap: '15px' }}
                      >
                        <img
                          src={item.image || '/images/default.jpg'}
                          alt={item.name}
                          className="cart-page-img"
                          style={{ 
                            width: '150px', 
                            height: '150px', 
                            objectFit: 'cover',
                            marginBottom: '10px'
                          }}
                        />
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">{item.name} ({item.size})</h5>
                            <p className="mb-0">${item.price.toFixed(2)}</p>
                          </div>
                          {item.upsells.length > 0 && (
                            <div className="mt-2">
                              {item.upsells.map((u, i) => (
                                <div key={i} className="d-flex justify-content-between align-items-center mb-1">
                                  <strong>Add-ons: {u.name}</strong>
                                  {isEditing ? (
                                    <div className="d-flex align-items-center">
                                      <div
                                        style={{
                                          width: '70px',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          marginRight: '10px',
                                        }}
                                      >
                                        <button
                                          className="btn btn-outline-secondary rounded-circle"
                                          style={{ width: '25px', height: '25px', padding: '0', fontSize: '14px', lineHeight: '23px' }}
                                          onClick={() => handleUpsellQtyChange(cartIndex, i, -1)}
                                        >
                                          -
                                        </button>
                                        <span style={{ width: '20px', textAlign: 'center' }}>{u.quantity}</span>
                                        <button
                                          className="btn btn-outline-secondary rounded-circle"
                                          style={{ width: '25px', height: '25px', padding: '0', fontSize: '14px', lineHeight: '23px' }}
                                          onClick={() => handleUpsellQtyChange(cartIndex, i, 1)}
                                        >
                                          +
                                        </button>
                                      </div>
                                      <span>${(u.price * u.quantity).toFixed(2)}</span>
                                    </div>
                                  ) : (
                                    <span>{u.quantity} x ${u.price.toFixed(2)}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {item.isDelivery && item.deliveryCost > 0 && (
                            <div className="d-flex justify-content-between mb-1">
                              <span>Delivery Cost{item.postalCode ? ` (${item.postalCode})` : ''}</span>
                              <span>${item.deliveryCost.toFixed(2)}</span>
                            </div>
                          )}
                          {item.deliveryDate && (
                            <p className="mb-1">
                              {item.isDelivery ? 'Delivery' : 'Pickup'} Date:{' '}
                              {new Date(item.deliveryDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          )}
                          {item.cardMessage && (
                            <p
                              className="font-italic mb-1"
                              style={{ 
                                maxWidth: '50%', 
                                backgroundColor: '#f8f9fa', 
                                padding: '5px', 
                                borderRadius: '5px' 
                              }}
                            >
                              Message: "{item.cardMessage}"
                            </p>
                          )}
                          {isEditing && (
                            <span
                              className="text-danger d-block text-right mt-1"
                              style={{ cursor: 'pointer', fontSize: '12px' }}
                              onClick={() => removeFromCart(cartIndex)}
                            >
                              Remove Item
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: '1px solid #ced4da', paddingTop: '10px' }}>
                    <div className="d-flex justify-content-between mb-3">
                      <strong>Cart Total</strong>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <button
                      className="btn btn-outline mb-3"
                      style={{ 
                        padding: '3px 8px', 
                        fontSize: '13px', 
                        backgroundColor: '#fff', 
                        borderColor: '#edafb8', 
                        color: '#edafb8', 
                        lineHeight: '1', 
                        minWidth: '50px', 
                        textAlign: 'center' 
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#edafb8';
                        e.target.style.color = '#fff';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = '#fff';
                        e.target.style.color = '#edafb8';
                      }}
                      onClick={toggleEdit}
                    >
                      {isEditing ? 'Done' : 'Edit'}
                    </button>
                    <div className="d-flex justify-content-end gap-2 cart-page-buttons">
                      <button
                        className="btn btn-outline"
                        style={{ 
                          backgroundColor: '#fff', 
                          borderColor: '#edafb8', 
                          color: '#edafb8' 
                        }}
                        onMouseOver={(e) => {
                          e.target.style.backgroundColor = '#edafb8';
                          e.target.style.color = '#fff';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.backgroundColor = '#fff';
                          e.target.style.color = '#edafb8';
                        }}
                        onClick={handleClearCart}
                      >
                        Clear Cart
                      </button>
                      <Link
                        to="/"
                        className="btn btn-outline"
                        style={{ 
                          backgroundColor: '#fff', 
                          borderColor: '#edafb8', 
                          color: '#edafb8' 
                        }}
                        onMouseOver={(e) => {
                          e.target.style.backgroundColor = '#edafb8';
                          e.target.style.color = '#fff';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.backgroundColor = '#fff';
                          e.target.style.color = '#edafb8';
                        }}
                      >
                        Continue Shopping
                      </Link>
                      <button
                        className="btn btn-primary"
                        style={{ backgroundColor: '#edafb8', borderColor: '#edafb8', color: '#fff' }}
                        onClick={handleCheckout}
                      >
                        Checkout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @media (max-width: 767px) {
          .cart-page-img {
            margin-bottom: 10px;
          }
          .d-flex.flex-md-row {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        }
      `}</style>
    </section>
  );
}

export default CartPage;