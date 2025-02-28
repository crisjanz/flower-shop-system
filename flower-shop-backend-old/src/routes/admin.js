const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/take-order', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin/take-order.html'));
});

router.post('/take-order', (req, res) => {
  const { employee, orderType, deliveryType, customerName, customerPhone, customerEmail, customerAddress, recipientName, recipientPhone, recipientAddress } = req.body;
  console.log('Order received:', { employee, orderType, deliveryType, customer: { name: customerName, phone: customerPhone, email: customerEmail, address: customerAddress }, recipient: { name: recipientName, phone: recipientPhone, address: recipientAddress } });
  res.redirect('/admin/take-order');
});

module.exports = router;