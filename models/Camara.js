const mongoose = require('mongoose');

const camaraSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  url: { type: String, required: true }, // RTSP o WebSocket
}, { timestamps: true });

module.exports = mongoose.model('Camara', camaraSchema);
