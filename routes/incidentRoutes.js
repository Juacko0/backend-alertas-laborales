const express = require("express");
const router = express.Router();
const Incident = require("../models/Incident");
const fetch = require("node-fetch"); // 👈 necesario para hacer peticiones HTTP internas

// URL base de tu backend (usa variable de entorno si existe)
const BACKEND_URL = process.env.BACKEND_URL || "https://backend-alertas-laborales.onrender.com";

// ==============================
// 🆕 Crear incidente + notificar
// ==============================
router.post("/addIncident", async (req, res) => {
  try {
    const incidentData = req.body;

    const newIncident = new Incident({
      ...incidentData,
      state: "Pendiente",
      intervention: {
        huboIntervencion: false,
        receivedAt: new Date(),
        attendedAt: null,
        attendedBy: "",
        injuryLevel: null,
      },
    });

    await newIncident.save();

    console.log("✅ Incidente registrado:", newIncident._id);

    // === Enviar notificación PWA solo con datos esenciales ===
    const profesionales = await Profesional.find({
      suscripcionPWA: { $exists: true, $ne: null },
    });

    const payload = JSON.stringify({
      title: "🚨 Nueva Alerta en el Centro",
      body: "Se ha detectado un posible incidente. Revísalo ahora.",
      data: {
        _id: newIncident._id, // 👈 ID real del incidente
        time: newIncident.createdAt,
      },
    });

    const notifications = profesionales.map(async (prof) => {
      try {
        await webpush.sendNotification(prof.suscripcionPWA, payload);
        console.log(`✅ Notificación enviada a ${prof.codigo}`);
      } catch (err) {
        console.error(`Error al enviar a ${prof.codigo}:`, err);
        if (err.statusCode === 410 || err.statusCode === 404) {
          await Profesional.updateOne(
            { codigo: prof.codigo },
            { $unset: { suscripcionPWA: "" } }
          );
        }
      }
    });

    await Promise.all(notifications);

    res.status(201).json({
      message: "✅ Incidente registrado y notificación enviada",
      incident: newIncident,
    });
  } catch (err) {
    console.error("❌ Error al guardar incidente:", err);
    res.status(500).json({ message: "Error al guardar el incidente" });
  }
});

// ==============================
// 📋 Obtener todos los incidentes
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
// 🔍 Filtrar incidentes
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
// ✏️ Actualizar incidente completo
// ==============================
router.put("/updateIncident/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedIncident = await Incident.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedIncident) return res.status(404).json({ message: "Incidente no encontrado" });
    res.json(updatedIncident);
  } catch (err) {
    console.error("❌ Error al actualizar incidente:", err);
    res.status(500).json({ message: "Error al actualizar incidente" });
  }
});

// ==============================
// ✅ Confirmar si fue una caída real
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
// 🏥 Registrar intervención médica
// ==============================
router.put("/addIntervention/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { attendedBy, injuryLevel, confirmedBy, reportedBy, location, detail } = req.body;

    // 🕓 Se registra automáticamente la hora real de atención
    const updateData = {
      state: "Atendido",
      confirmedBy,
      "intervention.huboIntervencion": true,
      "intervention.attendedAt": new Date(),
      "intervention.attendedBy": attendedBy,
      "intervention.injuryLevel": injuryLevel,
    };

    // Si el móvil envía estos campos, los actualizamos también
    if (reportedBy) { updateData.reportedBy = reportedBy; updateData.residentName = reportedBy;} // 👈 añade esta línea 
    if (location) updateData.location = location;
    if (detail) updateData.detail = detail;

    const updated = await Incident.findByIdAndUpdate(id, updateData, { new: true });

    if (!updated) return res.status(404).json({ message: "Incidente no encontrado" });

    res.json({
      message: "✅ Intervención registrada correctamente con los datos del móvil",
      incident: updated,
    });
  } catch (err) {
    console.error("❌ Error al registrar intervención:", err);
    res.status(500).json({ message: "Error al registrar intervención" });
  }
});

module.exports = router;
