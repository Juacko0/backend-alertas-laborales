const express = require("express");
const router = express.Router();
const webpush = require("web-push");
const Subscription = require("../models/Subscription");
const Profesional = require("../models/Profesional");

// Configuración de claves VAPID
webpush.setVapidDetails(
  "mailto:tuemail@ejemplo.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Obtener clave pública
router.get("/vapidPublicKey", (req, res) => {
  res.send(process.env.VAPID_PUBLIC_KEY);
});

// Registrar suscripción
router.post("/subscribe", async (req, res) => {
  try {
    const { subscription, profesionalCodigo } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: "Subscription inválida" });
    }

    await Subscription.updateOne(
      { endpoint: subscription.endpoint },
      subscription,
      { upsert: true }
    );

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

// Enviar notificaciones a todos los profesionales
router.post("/notify", async (req, res) => {
  try {
    const { title, message } = req.body;
    const payload = JSON.stringify({ title, body: message });

    // Buscar todos los profesionales que tengan una suscripción PWA
    const profesionales = await Profesional.find({ suscripcionPWA: { $exists: true } });

    if (profesionales.length === 0) {
      return res.status(404).json({ message: "No hay suscripciones registradas" });
    }

    // Enviar notificación a cada profesional con suscripción
    const notifications = profesionales.map(async (prof) => {
      try {
        await webpush.sendNotification(prof.suscripcionPWA, payload);
        console.log(`✅ Notificación enviada a ${prof.codigo}`);
      } catch (err) {
        console.error(`Error al enviar a ${prof.codigo}:`, err);

        // Si la suscripción es inválida, eliminarla
        if (err.statusCode === 410 || err.statusCode === 404) {
          await Profesional.updateOne(
            { codigo: prof.codigo },
            { $unset: { suscripcionPWA: "" } }
          );
          console.warn(`❌ Suscripción eliminada de ${prof.codigo}`);
        }
      }
    });

    await Promise.all(notifications);
    res.status(200).json({ message: "✅ Notificaciones enviadas a todos los profesionales" });
  } catch (err) {
    console.error("❌ Error general al enviar notificaciones:", err);
    res.status(500).json({ message: "Error enviando notificaciones" });
  }
});

module.exports = router;