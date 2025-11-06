const express = require("express");
const router = express.Router();
const webpush = require("web-push");
const Subscription = require("../models/Subscription");
const Profesional = require("../models/Profesional");

// ====================================
// 🔑 Configuración de claves VAPID
// ====================================
webpush.setVapidDetails(
  "mailto:tuemail@ejemplo.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ====================================
// 📤 Obtener clave pública
// ====================================
router.get("/vapidPublicKey", (req, res) => {
  res.send(process.env.VAPID_PUBLIC_KEY);
});

// ====================================
// 📩 Registrar suscripción
// ====================================
router.post("/subscribe", async (req, res) => {
  try {
    const { subscription, profesionalCodigo } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: "Subscription inválida" });
    }

    // Guarda o actualiza la suscripción
    await Subscription.updateOne(
      { endpoint: subscription.endpoint },
      subscription,
      { upsert: true }
    );

    // Vincula la suscripción al profesional si se pasa el código
    if (profesionalCodigo) {
      const profesionalActualizado = await Profesional.findOneAndUpdate(
        { codigo: profesionalCodigo },
        { suscripcionPWA: subscription },
        { new: true }
      );

      if (profesionalActualizado) {
        console.log(`✅ Suscripción vinculada al profesional ${profesionalCodigo}`);
      } else {
        console.warn(`⚠️ No se encontró profesional con código ${profesionalCodigo}`);
      }
    }

    res.status(201).json({ message: "Suscripción registrada correctamente" });
  } catch (err) {
    console.error("❌ Error guardando suscripción:", err);
    res.status(500).json({ message: "Error guardando la suscripción" });
  }
});

// ====================================
// 🚨 Enviar notificación a profesionales
// ====================================
router.post("/notify", async (req, res) => {
  try {
    const { title, message, incidentId, location, detail, isFall } = req.body;

    // ✅ Aseguramos que haya al menos un título o mensaje
    if (!title || !message) {
      return res.status(400).json({ message: "Faltan campos obligatorios (title o message)" });
    }

    // ✅ Payload mejorado con ID del incidente y metadatos
    const payload = JSON.stringify({
      title: title || "🚨 Nueva Alerta",
      body: message,
      data: {
        _id: incidentId || null,  // 👈 ID del incidente
        location: location || "Sin ubicación especificada",
        detail: detail || "Sin detalles adicionales",
        isFall: isFall || false,
        createdAt: new Date().toISOString()
      }
    });

    // ✅ Buscar profesionales suscritos
    const profesionales = await Profesional.find({ suscripcionPWA: { $exists: true } });

    if (profesionales.length === 0) {
      return res.status(404).json({ message: "No hay suscripciones registradas" });
    }

    console.log(`📢 Enviando notificaciones a ${profesionales.length} profesionales...`);

    // ✅ Enviar notificación a cada profesional
    const notifications = profesionales.map(async (prof) => {
      try {
        await webpush.sendNotification(prof.suscripcionPWA, payload);
        console.log(`✅ Notificación enviada a ${prof.codigo}`);
      } catch (err) {
        console.error(`❌ Error al enviar a ${prof.codigo}:`, err);

        // 🔁 Si la suscripción está vencida o no válida, se elimina
        if (err.statusCode === 410 || err.statusCode === 404) {
          await Profesional.updateOne(
            { codigo: prof.codigo },
            { $unset: { suscripcionPWA: "" } }
          );
          console.warn(`🗑️ Suscripción eliminada de ${prof.codigo}`);
        }
      }
    });

    await Promise.all(notifications);

    res.status(200).json({
      message: "✅ Notificaciones enviadas correctamente",
      enviados: profesionales.length,
    });
  } catch (err) {
    console.error("❌ Error general al enviar notificaciones:", err);
    res.status(500).json({ message: "Error enviando notificaciones" });
  }
});

module.exports = router;
