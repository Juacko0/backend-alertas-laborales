const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "mi_clave_secreta";

function verifyJWT(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "Falta el token de autenticación" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token no válido o ausente" });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Token inválido o expirado" });
    req.user = decoded; // 👈 Guarda los datos del usuario para usarlos en las rutas
    next();
  });
}

module.exports = verifyJWT;
