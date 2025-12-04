const express = require('express');
const { requireAuth } = require('../middleware/supabaseAuth');

// Optional: Integrate Stripe/Razorpay later. Stub endpoints for now.
const router = express.Router();

router.post('/create-checkout-session', requireAuth, async (_req, res) => {
  res.json({ url: 'https://example.com/checkout/session' });
});

router.post('/verify', requireAuth, async (_req, res) => {
  res.json({ verified: true });
});

module.exports = router;