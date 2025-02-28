import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Card } from 'react-bootstrap';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51OajyeBxoCAP8QMVXISVMPyaGSPtIF01InLULkiURi6zqSo5FPJCmlknmW1gHRCxDJasvYVSAjQVoVMyrzEAEpz3006LEMl30Z'); // Replace with your pk_test_...

const CheckoutForm = ({ cartTotal, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required', // Stay on page unless redirect needed
    });

    if (error) {
      setError(error.message);
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setProcessing(false);
      onSuccess(); // Trigger success handling
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || processing}
        variant="primary"
        className="mt-3"
        style={{ backgroundColor: '#edafb8', borderColor: '#edafb8' }}
      >
        {processing ? 'Processing...' : `Pay $${cartTotal.toFixed(2)}`}
      </Button>
      {error && <div className="text-danger mt-2">{error}</div>}
    </Form>
  );
};

const CheckoutPage = ({ cart, clearCart }) => {
  console.log('Cart in CheckoutPage:', cart);

  const [step, setStep] = useState(1);
  const [senderInfo, setSenderInfo] = useState({ name: '', phone: '', email: '', address: '', contactPref: 'text', postalCode: '' });
  const [recipientInfo, setRecipientInfo] = useState({
    firstName: '',
    lastName: '',
    address: '',
    postalCode: '',
    city: '',
    country: '',
    phone: '',
    instructions: ''
  });
  const [clientSecret, setClientSecret] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const cartTotal = cart.reduce((sum, item) => {
    const upsellSum = item.upsells.reduce((s, u) => s + u.price * u.quantity, 0);
    return sum + item.price + upsellSum + (item.isDelivery ? item.deliveryCost || 0 : 0);
  }, 0);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSenderChange = (e) => {
    const { name, value } = e.target;
    setSenderInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleRecipientChange = (e) => {
    const { name, value } = e.target;
    setRecipientInfo(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const loadGoogleScript = () => {
      if (!document.getElementById('google-maps-script')) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyB550tfeabwT0zRGecbLdmoITNsYoP2AIg&libraries=places&loading=async';
        script.async = true;
        document.body.appendChild(script);
      }
    };
    loadGoogleScript();
  }, []);

  useEffect(() => {
    if (step === 2 && window.google && window.google.maps && window.google.maps.places) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        document.getElementById('senderAddress'),
        { types: ['geocode'], componentRestrictions: { country: 'ca' } }
      );
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          const addressComponents = place.address_components;
          let postalCode = '';
          addressComponents.forEach(component => {
            if (component.types.includes('postal_code')) {
              postalCode = component.long_name;
            }
          });
          setSenderInfo(prev => ({ ...prev, address: place.formatted_address, postalCode }));
        }
      });
    }
  }, [step]);

  useEffect(() => {
    if (step === 3 && window.google && window.google.maps && window.google.maps.places) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        document.getElementById('recipientAddress'),
        { types: ['geocode'], componentRestrictions: { country: 'ca' } }
      );
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          const addressComponents = place.address_components;
          let newInfo = { address: place.formatted_address };
          addressComponents.forEach(component => {
            const types = component.types;
            if (types.includes('postal_code')) newInfo.postalCode = component.long_name;
            if (types.includes('locality')) newInfo.city = component.long_name;
            if (types.includes('country')) newInfo.country = component.long_name;
          });
          setRecipientInfo(prev => ({ ...prev, ...newInfo }));
        }
      });
    }
  }, [step]);

  useEffect(() => {
    if (step === 4 && !clientSecret) {
      const fetchClientSecret = async () => {
        const response = await fetch('http://localhost:3002/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: cartTotal * 100 }),
        });
        const data = await response.json();
        setClientSecret(data.clientSecret);
      };
      fetchClientSecret();
    }
  }, [step, cartTotal, clientSecret]);

  const handlePaymentSuccess = () => {
    clearCart();
    setPaymentSuccess(true);
  };

  return (
    <Container className="py-5" style={{ backgroundColor: '#f8f9fa' }}>
      <Row>
        <Col md={8}>
          <Card className="mb-4" style={{ backgroundColor: '#fff' }}>
            <Card.Body>
              {step === 1 && (
                <div>
                  <Card.Title style={{ fontSize: '1.5rem' }}>Step 1: Login or Continue as Guest</Card.Title>
                  <Button
                    variant="outline-primary"
                    className="me-2 custom-outline-btn"
                    style={{ borderColor: '#edafb8', color: '#edafb8' }}
                    onClick={nextStep}
                  >
                    Login
                  </Button>
                  <Button
                    variant="primary"
                    style={{ backgroundColor: '#edafb8', borderColor: '#edafb8' }}
                    onClick={nextStep}
                  >
                    Continue as Guest
                  </Button>
                </div>
              )}
              {step === 2 && (
                <div>
                  <Card.Title style={{ fontSize: '1.5rem' }}>Step 2: Sender Information</Card.Title>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Name <span style={{ color: 'red' }}>*</span></Form.Label>
                      <Form.Control type="text" name="name" value={senderInfo.name} onChange={handleSenderChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone <span style={{ color: 'red' }}>*</span></Form.Label>
                      <Form.Control type="tel" name="phone" value={senderInfo.phone} onChange={handleSenderChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control type="email" name="email" value={senderInfo.email} onChange={handleSenderChange} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        type="text"
                        id="senderAddress"
                        name="address"
                        value={senderInfo.address}
                        onChange={handleSenderChange}
                        autoComplete="off"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Contact Preference</Form.Label>
                      <Form.Check
                        type="radio"
                        label="Text updates"
                        name="contactPref"
                        value="text"
                        checked={senderInfo.contactPref === 'text'}
                        onChange={handleSenderChange}
                      />
                      <Form.Check
                        type="radio"
                        label="Email only"
                        name="contactPref"
                        value="email"
                        checked={senderInfo.contactPref === 'email'}
                        onChange={handleSenderChange}
                      />
                    </Form.Group>
                    <Button
                      variant="outline-primary"
                      className="me-2 custom-outline-btn"
                      style={{ borderColor: '#edafb8', color: '#edafb8' }}
                      onClick={prevStep}
                    >
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      style={{ backgroundColor: '#edafb8', borderColor: '#edafb8' }}
                      onClick={nextStep}
                      disabled={!senderInfo.name || !senderInfo.phone}
                    >
                      Next
                    </Button>
                  </Form>
                </div>
              )}
              {step === 3 && (
                <div>
                  <Card.Title style={{ fontSize: '1.5rem' }}>Step 3: Recipient Information</Card.Title>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name <span style={{ color: 'red' }}>*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        value={recipientInfo.firstName}
                        onChange={handleRecipientChange}
                        required
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Last Name <span style={{ color: 'red' }}>*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        value={recipientInfo.lastName}
                        onChange={handleRecipientChange}
                        required
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Address <span style={{ color: 'red' }}>*</span></Form.Label>
                      <Form.Control
                        type="text"
                        id="recipientAddress"
                        name="address"
                        value={recipientInfo.address}
                        onChange={handleRecipientChange}
                        autoComplete="off"
                        required
                      />
                    </Form.Group>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>City <span style={{ color: 'red' }}>*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="city"
                            value={recipientInfo.city}
                            onChange={handleRecipientChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Country <span style={{ color: 'red' }}>*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="country"
                            value={recipientInfo.country}
                            onChange={handleRecipientChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-3">
                      <Form.Label>Postal Code <span style={{ color: 'red' }}>*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="postalCode"
                        value={recipientInfo.postalCode}
                        onChange={handleRecipientChange}
                        required
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone <span style={{ color: 'red' }}>*</span></Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={recipientInfo.phone}
                        onChange={handleRecipientChange}
                        required
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Delivery Instructions (optional)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="instructions"
                        value={recipientInfo.instructions}
                        onChange={handleRecipientChange}
                      />
                    </Form.Group>
                    <Button
                      variant="outline-primary"
                      className="me-2 custom-outline-btn"
                      style={{ borderColor: '#edafb8', color: '#edafb8' }}
                      onClick={prevStep}
                    >
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      style={{ backgroundColor: '#edafb8', borderColor: '#edafb8' }}
                      onClick={nextStep}
                      disabled={!recipientInfo.firstName || !recipientInfo.lastName || !recipientInfo.address || !recipientInfo.postalCode || !recipientInfo.city || !recipientInfo.country || !recipientInfo.phone}
                    >
                      Next
                    </Button>
                  </Form>
                </div>
              )}
              {step === 4 && (
                <div>
                  <Card.Title style={{ fontSize: '1.5rem' }}>Step 4: Payment</Card.Title>
                  {paymentSuccess ? (
                    <div className="text-center">
                      <h5 className="text-success">Payment Successful!</h5>
                      <p>Your order has been confirmed. Thank you for shopping with In Your Vase!</p>
                      <Button
                        variant="primary"
                        style={{ backgroundColor: '#edafb8', borderColor: '#edafb8' }}
                        onClick={() => setStep(1)}
                      >
                        Back to Home
                      </Button>
                    </div>
                  ) : clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <CheckoutForm cartTotal={cartTotal} onSuccess={handlePaymentSuccess} />
                    </Elements>
                  ) : (
                    <p>Loading payment details...</p>
                  )}
                  {!paymentSuccess && (
                    <Button
                      variant="outline-primary"
                      className="mt-3 me-2 custom-outline-btn"
                      style={{ borderColor: '#edafb8', color: '#edafb8' }}
                      onClick={prevStep}
                    >
                      Back
                    </Button>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card style={{ backgroundColor: '#fff' }}>
            <Card.Body>
              <Card.Title style={{ fontSize: '1.5rem' }}>Order Summary</Card.Title>
              {cart.length > 0 ? (
                cart.map((item, index) => (
                  <div key={index} className="mb-2">
                    <p>{item.name} - ${item.price} x {item.quantity || 1}</p>
                    {item.upsells.map((upsell, i) => (
                      <p key={i} className="ms-3">Add-on: {upsell.name} - ${upsell.price.toFixed(2)} x {upsell.quantity}</p>
                    ))}
                    {item.isDelivery && item.deliveryCost > 0 && (
                      <p>Delivery: ${item.deliveryCost.toFixed(2)}</p>
                    )}
                  </div>
                ))
              ) : (
                <p>Your cart is empty.</p>
              )}
              <p><strong>Total: ${cartTotal.toFixed(2)}</strong></p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutPage;