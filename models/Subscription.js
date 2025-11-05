const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  profesionalCodigo: { type: String } // opcional
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
