const express = require("express");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory idempotency store: key -> transaction record
const idempotencyStore = new Map();

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ service: "payment-idempotency-service", ok: true });
});

// Idempotent charge creation endpoint
app.post("/api/v1/charges", (req, res) => {
  const idempotencyKey = req.get("Idempotency-Key");

  // Reject requests missing the Idempotency-Key header
  if (!idempotencyKey) {
    return res.status(400).json({ error: "Missing Idempotency-Key header" });
  }

  // Safe replay: return cached transaction payload on duplicate retries
  if (idempotencyStore.has(idempotencyKey)) {
    const cachedRecord = idempotencyStore.get(idempotencyKey);
    res.set("X-Idempotent-Replayed", "true");
    return res.status(200).json(cachedRecord);
  }

  // First-time execution: generate fresh UUID and cache transaction
  const record = {
    transactionId: crypto.randomUUID(),
    amount: req.body.amount,
    status: "succeeded"
  };

  idempotencyStore.set(idempotencyKey, record);
  res.set("X-Idempotent-Replayed", "false");
  return res.status(201).json(record);
});

app.listen(PORT, () => {
  console.log(`Payment Idempotency Service listening on port ${PORT}`);
});
