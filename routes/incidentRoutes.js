const express = require("express");
const router = express.Router();
const Incident = require("../models/Incident");

// ==============================
// Crear incidente
// ==============================
router.post("/addIncident", async (req, res) => {
  try {
    const incidentData = req.body;
    const newIncident = new Incident(incidentData);
    await newIncident.save();
    res.status(201).json({ message: "✅ Incidente registrado correctamente", incident: newIncident });
  } catch (err) {
    console.error("❌ Error al guardar incidente:", err);
    res.status(500).json({ message: "Error al guardar el incidente" });
  }
});

// ==============================
// Obtener todos los incidentes
// ==============================
router.get("/listIncidents", async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ createdAt: -1 });
    res.status(200).json(incidents);
  } catch (err) {
    console.error("❌ Error al obtener incidentes:", err);
    res.status(500).json({ message: "Error al obtener los incidentes" });
  }
});

// ==============================
// Filtrar incidentes
// ==============================
router.post("/filterIncidents", async (req, res) => {
  try {
    const { date, state, location } = req.body;
    const query = {};

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.time = { $gte: start, $lt: end };
    }

    if (state && state !== "Todos") query.state = state;
    if (location) query.location = { $regex: location, $options: "i" };

    const incidents = await Incident.find(query).sort({ time: -1 });
    res.json(incidents);
  } catch (err) {
    console.error("❌ Error al filtrar incidentes:", err);
    res.status(500).json({ message: "Error al aplicar filtros" });
  }
});

// ==============================
// Actualizar incidente completo
// ==============================
router.put("/updateIncident/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedIncident = await Incident.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updatedIncident);
  } catch (err) {
    console.error("❌ Error al actualizar incidente:", err);
    res.status(500).json({ message: "Error al actualizar incidente" });
  }
});

// ==============================
// Confirmar si fue una caída real
// ==============================
router.put("/confirmFall/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { isFall, confirmedBy } = req.body;

    const updated = await Incident.findByIdAndUpdate(
      id,
      { isFall, confirmedBy },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Incidente no encontrado" });
    res.json({ message: "✅ Confirmación registrada", incident: updated });
  } catch (err) {
    console.error("❌ Error al confirmar caída:", err);
    res.status(500).json({ message: "Error al confirmar caída" });
  }
});

// ==============================
// Registrar intervención médica
// ==============================
router.put("/addIntervention/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedAt, attendedAt, attendedBy, injuryLevel, confirmedBy } = req.body;

    const updated = await Incident.findByIdAndUpdate(
      id,
      {
        state: "Atendido",
        confirmedBy,
        intervention: {
          huboIntervencion: true,
          receivedAt,
          attendedAt,
          attendedBy,
          injuryLevel
        }
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Incidente no encontrado" });
    res.json({ message: "✅ Intervención registrada correctamente", incident: updated });
  } catch (err) {
    console.error("❌ Error al registrar intervención:", err);
    res.status(500).json({ message: "Error al registrar intervención" });
  }
});

module.exports = router;
