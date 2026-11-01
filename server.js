const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ service: "payment-idempotency-service", ok: true });
});

app.listen(PORT, () => {
  console.log(`Payment Idempotency Service listening on port ${PORT}`);
});
