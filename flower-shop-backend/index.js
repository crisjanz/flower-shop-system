const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const fetch = require('node-fetch');
const stripe = require('stripe')('sk_test_51OajyeBxoCAP8QMVtlVatVWDPFcg1cKAPxWqRJxDKwE4fiH3BjBdf7jKW5pZH11J5qvHUcCTvFOnaT10TKLrmsWF004tdWALXT');

const app = express();
const port = 3002;

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:3000', // Allow frontend origin
  methods: ['GET', 'POST'], // Allow these methods
  allowedHeaders: ['Content-Type'], // Allow this header
}));
app.use(express.json());

app.get('/admin/take-order', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Take Order - Admin</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        body { font-family: 'Arial', sans-serif; background: #f8f9fa; padding: 20px; }
        h1 { color: #28a745; font-weight: bold; }
        .section { background: #fff; padding: 15px; margin-bottom: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        label { font-weight: 500; margin-bottom: 5px; }
        input, select { width: 100%; max-width: 300px; margin-bottom: 15px; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; }
        button { background: #28a745; border: none; padding: 10px 20px; font-size: 16px; }
        button:hover { background: #218838; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Take Order (Phone)</h1>
        <form action="/admin/take-order" method="POST">
          <div class="section">
            <h2>Order Info</h2>
            <div class="mb-3">
              <label>Employee Name:</label>
              <input type="text" name="employee" class="form-control" required>
            </div>
            <div class="mb-3">
              <label>Order Type:</label>
              <select name="orderType" class="form-select">
                <option value="phone">Phone</option>
                <option value="in-person">In-Person</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="mb-3">
              <label>Delivery Type:</label>
              <select name="deliveryType" class="form-select">
                <option value="delivery">Delivery</option>
                <option value="pickup">Pickup</option>
              </select>
            </div>
          </div>
          <div class="section">
            <h2>Customer Info</h2>
            <div class="mb-3">
              <label>Customer Name:</label>
              <input type="text" name="customerName" class="form-control" required>
            </div>
            <div class="mb-3">
              <label>Customer Phone:</label>
              <input type="tel" name="customerPhone" class="form-control" required>
            </div>
            <div class="mb-3">
              <label>Customer Email:</label>
              <input type="email" name="customerEmail" class="form-control">
            </div>
            <div class="mb-3">
              <label>Customer Address:</label>
              <input type="text" name="customerAddress" class="form-control">
            </div>
          </div>
          <div class="section">
            <h2>Recipient Info</h2>
            <div class="mb-3">
              <label>Recipient Name:</label>
              <input type="text" name="recipientName" class="form-control" required>
            </div>
            <div class="mb-3">
              <label>Recipient Phone:</label>
              <input type="tel" name="recipientPhone" class="form-control">
            </div>
            <div class="mb-3">
              <label>Recipient Address:</label>
              <input type="text" name="recipientAddress" class="form-control" required>
            </div>
          </div>
          <button type="submit" class="btn btn-success">Save Order</button>
        </form>
      </div>
    </body>
    </html>
  `);
});


const pool = new Pool({
  user: 'cristianjanz',
  host: 'localhost',
  database: 'flower_shop',
  password: '',
  port: 5432,
});

app.get('/api/products', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM products';
    let values = [];
    if (category) {
      query += ' WHERE category = $1';
      values.push(category.toLowerCase());
    }
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/delivery-cost-tiers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM delivery_cost_tiers ORDER BY max_distance ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching delivery cost tiers:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/delivery-distance', async (req, res) => {
  const { destination } = req.query;
  const origin = '4190 15th Ave, Prince George, BC, V2M1V8';
  const apiKey = 'AIzaSyB550tfeabwT0zRGecbLdmoITNsYoP2AIg';

  if (!destination) {
    return res.status(400).json({ error: 'Destination address is required' });
  }

  const postalCodeMatch = destination.match(/[A-Za-z0-9]{3}\s?[A-Za-z0-9]{3}/i);
  const postalCode = postalCodeMatch ? postalCodeMatch[0].replace(/(\w{3})(\w{3})/, '$1 $2') : destination;
  const normalizedDestination = `${postalCode}, BC`;

  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(normalizedDestination)}&key=${apiKey}`;
    console.log('Fetching from Google Maps:', url);
    const response = await fetch(url);
    const text = await response.text();
    console.log('Raw response:', text);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}, Body: ${text}`);
    }

    const data = JSON.parse(text);
    console.log('Google Maps full response:', JSON.stringify(data));

    if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
      const distanceInMeters = data.rows[0].elements[0].distance.value;
      const distanceInKm = distanceInMeters / 1000;
      console.log('Calculated distance (km):', distanceInKm);

      if (distanceInMeters === 0) {
        return res.status(400).json({ error: 'Invalid postal code', details: 'Distance returned as zero' });
      }

      const tiersResult = await pool.query('SELECT * FROM delivery_cost_tiers ORDER BY max_distance ASC');
      const tiers = tiersResult.rows;
      console.log('Tiers:', tiers);

      const maxDistance = Math.max(...tiers.map(t => t.max_distance));
      if (distanceInKm > maxDistance) {
        return res.status(400).json({ error: 'Out of delivery area', distance: distanceInKm });
      }

      const tier = tiers.find((t, i) => {
        return distanceInKm >= t.min_distance && (distanceInKm <= t.max_distance || (i < tiers.length - 1 && distanceInKm < tiers[i + 1].min_distance));
      });
      console.log('Matched tier:', tier);
      const deliveryCost = tier ? tier.cost : tiers[0].cost;
      console.log('Final deliveryCost:', deliveryCost);

      const responseData = { distance: distanceInKm, cost: deliveryCost };
      console.log('Response sent:', responseData);
      res.json(responseData);
    } else {
      return res.status(400).json({ 
        error: 'Invalid postal code', 
        details: data.status === 'OK' ? 'No distance returned' : data.status || 'Unknown error',
        elementStatus: data.rows?.[0]?.elements?.[0]?.status || 'No elements'
      });
    }
  } catch (error) {
    console.error('Error fetching distance:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.post('/admin/take-order', async (req, res) => {
  const {
    employee, orderType, deliveryType,
    customerName, customerPhone, customerEmail, customerAddress,
    recipientName, recipientPhone, recipientAddress
  } = req.body;
  console.log('Order received:', {
    employee, orderType, deliveryType,
    customer: { name: customerName, phone: customerPhone, email: customerEmail, address: customerAddress },
    recipient: { name: recipientName, phone: recipientPhone, address: recipientAddress }
  });
  res.redirect('/admin/take-order');
});

app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 50) {
      return res.status(400).json({ error: 'Amount must be at least 50 cents' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'cad',
      payment_method_types: ['card'],
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.post('/api/cart', async (req, res) => {
  const { guest_id, item } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM carts WHERE guest_id = $1', [guest_id]);
    let items = existing.rows.length ? existing.rows[0].items : [];
    if (Array.isArray(item)) {
      items = item; // Replace full cart (e.g., for clear or updates)
    } else {
      items.push(item); // Add single item
    }
    if (existing.rows.length) {
      await pool.query('UPDATE carts SET items = $1, updated_at = NOW() WHERE guest_id = $2', [JSON.stringify(items), guest_id]);
    } else {
      await pool.query('INSERT INTO carts (guest_id, items) VALUES ($1, $2)', [guest_id, JSON.stringify([item])]);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving cart:', error);
    res.status(500).json({ error: 'Failed to save cart' });
  }
});

app.get('/api/cart', async (req, res) => {
  const { guest_id } = req.query;
  try {
    const result = await pool.query('SELECT items FROM carts WHERE guest_id = $1', [guest_id]);
    res.json(result.rows.length ? result.rows[0].items : []);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});