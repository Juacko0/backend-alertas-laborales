const mongoose = require('mongoose');

const profesionalesSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true }, // P001
  nombre: { type: String, required: true },
  horario: { type: String, required: true },
  estado: { type: String, enum: ['Activo', 'Inactivo'], default: 'Activo' },

  // Enlace con la cuenta de usuario
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },

    // 🔔 Enlace a la suscripción PWA (notificaciones push)
  suscripcionPWA: { type: Object, default: null },
  
}, { timestamps: true });

module.exports = mongoose.model('Profesional', profesionalesSchema);
