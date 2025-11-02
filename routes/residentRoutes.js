const express = require("express");
const router = express.Router();
const Resident = require("../models/Resident");

// ==============================
// Crear nuevo residente
// ==============================
router.post("/addResident", async (req, res) => {
  try {
    const nuevoResidente = new Resident(req.body);
    await nuevoResidente.save();
    res.status(201).json({ message: "✅ Residente registrado", residente: nuevoResidente });
  } catch (err) {
    console.error("❌ Error al registrar residente:", err);
    res.status(500).json({ message: "Error al registrar residente" });
  }
});

// ==============================
// Listar residentes
// ==============================
router.get("/listResidents", async (req, res) => {
  try {
    const residentes = await Resident.find();
    res.json({ message: "✅ Lista de residentes", residentes });
  } catch (err) {
    console.error("❌ Error al listar residentes:", err);
    res.status(500).json({ message: "Error al listar residentes" });
  }
});

// ==============================
// Actualizar residente
// ==============================
router.put("/updateResident/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const actualizado = await Resident.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ message: "✅ Residente actualizado", residente: actualizado });
  } catch (err) {
    console.error("❌ Error al actualizar residente:", err);
    res.status(500).json({ message: "Error al actualizar residente" });
  }
});

// ==============================
// Eliminar residente
// ==============================
router.delete("/deleteResident/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Resident.findByIdAndDelete(id);
    res.json({ message: "🗑️ Residente eliminado" });
  } catch (err) {
    console.error("❌ Error al eliminar residente:", err);
    res.status(500).json({ message: "Error al eliminar residente" });
  }
});

module.exports = router;
