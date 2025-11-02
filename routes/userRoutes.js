const express = require("express");
const router = express.Router();
const Usuario = require("../models/Usuario");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const verifyJWT = require("../middleware/verifyJWT");

const SECRET_KEY = process.env.JWT_SECRET || "miSuperSecreto123";

// ==============================
// Registrar nuevo usuario (manual)
// ==============================
router.post("/register", async (req, res) => {
  try {
    const { usuario, contraseña, rol, codigo } = req.body;

    const existe = await Usuario.findOne({ usuario });
    if (existe) return res.status(400).json({ message: "El usuario ya existe" });

    const hashedPassword = await bcrypt.hash(contraseña, 10);
    const nuevoUsuario = new Usuario({ usuario, contraseña: hashedPassword, rol, codigo });
    await nuevoUsuario.save();

    res.status(201).json({ message: "✅ Usuario registrado correctamente" });
  } catch (err) {
    console.error("❌ Error al registrar usuario:", err);
    res.status(500).json({ message: "Error al registrar usuario" });
  }
});

// ==============================
// Login
// ==============================
router.post("/login", async (req, res) => {
  try {
    const { usuario, contraseña } = req.body;
    const user = await Usuario.findOne({ usuario });

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const valid = await bcrypt.compare(contraseña, user.contraseña);
    if (!valid) return res.status(401).json({ message: "Contraseña incorrecta" });

    const token = jwt.sign( { usuario: user.usuario, rol: user.rol, codigo: user.codigo }, SECRET_KEY, { expiresIn: "2h" } );

    res.json({ message: "✅ Login exitoso", token, rol: user.rol, codigo: user.codigo });
  } catch (err) {
    console.error("❌ Error en login:", err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// ==============================
// Validar token
// ==============================
router.get("/verify", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token no proporcionado" });

    const decoded = jwt.verify(token, SECRET_KEY);
    res.json({ valido: true, usuario: decoded });
  } catch (err) {
    res.status(401).json({ valido: false, message: "Token inválido" });
  }
});

// ==============================
// Verificar sesión JWT
// ==============================
router.get("/me", verifyJWT, async (req, res) => {
  try {
    res.json({ usuario: req.user.usuario, rol: req.user.rol, codigo: req.user.codigo });
  } catch (err) {
    console.error("❌ Error en /me:", err);
    res.status(500).json({ message: "Error al verificar sesión" });
  }
});

module.exports = router;
