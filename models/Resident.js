const mongoose = require("mongoose");

const residentesSchema = new mongoose.Schema({
  id: { type: String, unique: true }, // se generará automáticamente
  nombreCompleto: { type: String, required: true, trim: true },
  edad: { type: Number, required: true, min: 0 },
  genero: { type: String, enum: ["Masculino", "Femenino", "Otro"], required: true },
  tipoApoyo: { type: String, default: "Ninguno" },
  condicionesMedicas: { type: [String], default: [] },
  alergias: { type: [String], default: [] },
  contactoEmergencia: {
    nombre: { type: String, required: true },
    parentesco: { type: String, required: true },
    telefono: { type: String, required: true },
  },
  fechaIngreso: { type: Date, default: Date.now }, // si no se envía, se pone hoy
  estado: { type: String, enum: ["Activo", "Inactivo"], default: "Activo" },
  dni: { type: String, required: true, unique: true }
}, { timestamps: true });

// ===============================
// Generar ID automático: R001, R002...
// ===============================
residentesSchema.pre("save", async function (next) {
  if (!this.id) {
    const lastResident = await mongoose.model("Resident").findOne().sort({ createdAt: -1 });
    let newNumber = 1;

    if (lastResident && lastResident.id) {
      const lastNum = parseInt(lastResident.id.replace("R", ""));
      if (!isNaN(lastNum)) newNumber = lastNum + 1;
    }

    this.id = `R${newNumber.toString().padStart(3, "0")}`; // R001, R002, R003...
  }

  // Si no tiene fechaIngreso, se asigna la actual
  if (!this.fechaIngreso) {
    this.fechaIngreso = new Date();
  }

  next();
});

module.exports = mongoose.model("Resident", residentesSchema);
