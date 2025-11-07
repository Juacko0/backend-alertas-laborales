const express = require("express");
const router = express.Router();
const Resident = require("../models/Resident");
const verifyJWT = require("../middleware/verifyJWT");

// ==============================
// Crear nuevo residente
// ==============================
router.post("/addResident", verifyJWT, async (req, res) => {
  try {
    // Solo el usuario con código P001 puede registrar
    if (req.user.codigo !== "P001") {
      return res.status(403).json({ message: "⛔ No tienes permisos para registrar residentes" });
    }

    // Verificar duplicado de DNI
    const existente = await Resident.findOne({ dni: req.body.dni });
    if (existente) {
      return res.status(400).json({ message: "⚠️ Ya existe un residente con este DNI" });
    }

    // Crear y guardar residente (el ID se genera automáticamente)
    const nuevoResidente = new Resident(req.body);
    await nuevoResidente.save();

    res.status(201).json({
      message: "✅ Residente registrado correctamente",
      residente: nuevoResidente,
    });
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
    const residentes = await Resident.find().sort({ createdAt: -1 });
    res.json({ message: "✅ Lista de residentes obtenida", residentes });
  } catch (err) {
    console.error("❌ Error al listar residentes:", err);
    res.status(500).json({ message: "Error al listar residentes" });
  }
});

// ==============================
// Obtener residente por ID (Mongo _id)
// ==============================
router.get("/getResident/:id", async (req, res) => {
  try {
    const residente = await Resident.findById(req.params.id);
    if (!residente) {
      return res.status(404).json({ message: "⚠️ Residente no encontrado" });
    }
    res.json({ message: "✅ Residente encontrado", residente });
  } catch (err) {
    console.error("❌ Error al buscar residente:", err);
    res.status(500).json({ message: "Error al buscar residente" });
  }
});

// ==============================
// Actualizar residente
// ==============================
router.put("/updateResident/:id", verifyJWT, async (req, res) => {
  try {
    if (req.user.codigo !== "P001") {
      return res.status(403).json({ message: "⛔ No tienes permisos para actualizar residentes" });
    }

    const { id } = req.params;
    const actualizado = await Resident.findByIdAndUpdate(id, req.body, { new: true });

    if (!actualizado) {
      return res.status(404).json({ message: "⚠️ Residente no encontrado" });
    }

    res.json({ message: "✅ Residente actualizado correctamente", residente: actualizado });
  } catch (err) {
    console.error("❌ Error al actualizar residente:", err);
    res.status(500).json({ message: "Error al actualizar residente" });
  }
});

// ==============================
// Eliminar residente
// ==============================
router.delete("/deleteResident/:id", verifyJWT, async (req, res) => {
  try {
    if (req.user.codigo !== "P001") {
      return res.status(403).json({ message: "⛔ No tienes permisos para eliminar residentes" });
    }

    const { id } = req.params;
    const eliminado = await Resident.findByIdAndDelete(id);

    if (!eliminado) {
      return res.status(404).json({ message: "⚠️ Residente no encontrado" });
    }

    res.json({ message: "🗑️ Residente eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar residente:", err);
    res.status(500).json({ message: "Error al eliminar residente" });
  }
});

module.exports = router;
