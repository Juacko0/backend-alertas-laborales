const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema({
  location: { type: String, required: true, default: "Ubicación no especificada" },
  time: { type: Date, default: Date.now },
  residentName: { type: String, default: "No registrado" },
  detail: { type: String, default: "" },
  state: { type: String, enum: ["Pendiente", "Atendido"], default: "Pendiente" },
  
  // ✅ Pregunta 1: ¿Fue una caída real?
  isFall: { type: Boolean, default: false },

  // ✅ Quién confirmó el incidente (persona que respondió el cuestionario)
  confirmedBy: { type: String, default: null },

  // ✅ Datos de intervención (si la hubo)
  intervention: {
    huboIntervencion: { type: Boolean, default: false }, // 👈 Nueva propiedad agregada
    receivedAt: { type: Date }, // Timestamp cuando se recibió la alerta
    attendedAt: { type: Date }, // Timestamp cuando se atendió
    attendedBy: { type: String }, // Código o nombre del encargado
    injuryLevel: { type: Number, enum: [1, 2, 3], default: 1 } // 1=leve, 2=moderada, 3=grave
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Incident", incidentSchema);