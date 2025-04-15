const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Acesso negado. Token não fornecido ou inválido." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("Chave secreta JWT não definida no servidor.");
    }

    const decodedPayload = jwt.verify(token, secret);

    req.user = {
      id: decodedPayload.userId,
      email: decodedPayload.email,
    };

    next();
  } catch (error) {
    console.error("Erro na autenticação do token:", error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expirado." });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token inválido." });
    }
    return res.status(500).json({ message: "Erro interno na autenticação." });
  }
}

module.exports = authMiddleware;
