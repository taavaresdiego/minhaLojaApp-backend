const express = require("express");
const db = require("../src/database");
const authMiddleware = require("../src/middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  console.log(`Usuário autenticado (ID: ${req.user.id}) acessando produtos.`);

  const sql = `SELECT id, nome, preco, descricao, imagemUrl FROM Products`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar produtos:", err.message);
      return res
        .status(500)
        .json({ message: "Erro interno ao buscar produtos." });
    }

    res.status(200).json(rows);
  });
});

module.exports = router;
