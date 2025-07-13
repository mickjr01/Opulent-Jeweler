const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

const prices = JSON.parse(fs.readFileSync('./prices.json', 'utf-8'));

app.get('/prices', (req, res) => {
  res.json(prices);
});

app.post('/create-checkout-session', async (req, res) => {
  try {
    const cart = req.body.cart;

    const line_items = cart.map(item => {
      const product = prices.find(p => p.id === item.id);
      const useWholesale = item.quantity >= 5;
      const price = useWholesale ? product.wholesale : product.retail;

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name
          },
          unit_amount: price * 100
        },
        quantity: item.quantity
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      success_url: 'https://your-site.onrender.com/success',
      cancel_url: 'https://your-site.onrender.com/cancel'
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(4242, () => console.log('Server running on port 4242'));
