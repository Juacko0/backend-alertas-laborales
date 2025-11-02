require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const webpush = require("web-push");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app); // usamos http para socket.io
const io = new Server(server, { cors: { origin: "*" } }); // WebSocket

const PORT = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI;
const SECRET_KEY = process.env.JWT_SECRET || "miSuperSecreto123";

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Rutas existentes
app.use("/api/notifications", require("./routes/notificationsRoutes"));
app.use("/api/incidents", require("./routes/incidentRoutes"));
app.use("/api/cameras", require("./routes/cameraRoutes"));
app.use("/api/professionals", require("./routes/professionalRoutes"));
app.use("/api/residents", require("./routes/residentRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

// Página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ------------------------------
// 🚀 Canal en tiempo real con WebSocket (para alertas y notificaciones)
// ------------------------------
const connectedUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado:", socket.id);

  // Cuando el usuario se registra en el WS (por ejemplo después del login)
  socket.on("register", (userId) => {
    connectedUsers.set(socket.id, userId);
    console.log(`✅ Usuario ${userId} registrado`);
  });

  // Cuando un usuario envía una alerta
  socket.on("alerta", (data) => {
    const senderId = connectedUsers.get(socket.id);
    console.log(`🚨 Alerta de ${senderId}:`, data);

    // Enviamos la alerta a todos los demás
    socket.broadcast.emit("nueva-alerta", {
      senderId,
      ...data,
    });
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Usuario desconectado: ${connectedUsers.get(socket.id)}`);
    connectedUsers.delete(socket.id);
  });
});

// ------------------------------
// 🚀 Conexión MongoDB + servidor
// ------------------------------
mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("✅ Conectado a MongoDB");
    server.listen(PORT, () =>
      console.log(`🚀 Servidor + WebSocket corriendo en http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error("❌ Error conectando a MongoDB:", err));
