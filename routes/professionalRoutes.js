const express = require("express");
const router = express.Router();
const Profesional = require("../models/Profesional");
const Usuario = require("../models/Usuario");

// ==============================
// Crear un nuevo profesional y usuario asociado
// ==============================
router.post("/addProfessional", async (req, res) => {
  try {
    const { codigo, nombres, apellidos, correo, telefono, cargo, horario, contraseña, rol } = req.body;

    const profesionalExistente = await Profesional.findOne({ codigo });
    if (profesionalExistente) {
      return res.status(400).json({ message: "El profesional ya existe" });
    }

    // Crear profesional
    const nuevoProfesional = new Profesional({
        codigo,
        nombre: `${nombres} ${apellidos}`, // Combinar nombres y apellidos
        horario, // asegúrate de recibir horario en el body
        estado: "Activo",
        codigoPWA: null,
    });
    await nuevoProfesional.save();

    // Crear usuario vinculado
    const nuevoUsuario = new Usuario({
      usuario: codigo,
      contraseña,
      rol,
      codigo: codigo,
    });
    await nuevoUsuario.save();

    res.status(201).json({
      message: "✅ Profesional y usuario creados correctamente",
      profesional: nuevoProfesional,
      usuario: nuevoUsuario,
    });
  } catch (err) {
    console.error("❌ Error al crear profesional:", err);
    res.status(500).json({ message: "Error al crear profesional" });
  }
});

// ==============================
// Obtener todos los profesionales
// ==============================
router.get("/listProfessional", async (req, res) => {
  try {
    const profesionales = await Profesional.find();
    res.json(profesionales);
  } catch (err) {
    console.error("❌ Error al listar profesionales:", err);
    res.status(500).json({ message: "Error al listar profesionales" });
  }
});

// ==============================
// Actualizar profesional
// ==============================
router.put("/updateProfessional/:codigo", async (req, res) => {
  try {
    const { codigo } = req.params;
    const datosActualizados = req.body;
    const profesional = await Profesional.findOneAndUpdate({ codigo }, datosActualizados, { new: true });

    if (!profesional) {
      return res.status(404).json({ message: "Profesional no encontrado" });
    }

    res.json({ message: "✅ Profesional actualizado", profesional });
  } catch (err) {
    console.error("❌ Error al actualizar profesional:", err);
    res.status(500).json({ message: "Error al actualizar profesional" });
  }
});

// ==============================
// Eliminar profesional
// ==============================
router.delete("/deleteProfessional/:codigo", async (req, res) => {
  try {
    const { codigo } = req.params;
    await Profesional.deleteOne({ codigo });
    await Usuario.deleteOne({ codigo });
    res.json({ message: "🗑️ Profesional y usuario eliminados" });
  } catch (err) {
    console.error("❌ Error al eliminar profesional:", err);
    res.status(500).json({ message: "Error al eliminar profesional" });
  }
});

module.exports = router;
