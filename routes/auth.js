const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../src/database");

const router = express.Router();
const saltRounds = 10;

router.post("/register", async (req, res) => {
  const { nomeCompleto, cpf, email, senha } = req.body;

  if (!nomeCompleto || !cpf || !email || !senha) {
    return res.status(400).json({
      message:
        "Todos os campos são obrigatórios (nomeCompleto, cpf, email, senha).",
    });
  }

  const cpfLimpo = cpf.replace(/\D/g, "");

  try {
    const checkSql = `SELECT id FROM Users WHERE email = ? OR cpf = ?`;
    db.get(checkSql, [email, cpfLimpo], async (err, row) => {
      if (err) {
        console.error("Erro ao verificar usuário existente:", err.message);
        return res
          .status(500)
          .json({ message: "Erro interno ao verificar usuário." });
      }
      if (row) {
        return res.status(409).json({ message: "Email ou CPF já cadastrado." });
      }

      const passwordHash = await bcrypt.hash(senha, saltRounds);

      const insertSql = `INSERT INTO Users (nomeCompleto, cpf, email, passwordHash) VALUES (?, ?, ?, ?)`;
      db.run(
        insertSql,
        [nomeCompleto, cpfLimpo, email, passwordHash],
        function (err) {
          if (err) {
            console.error("Erro ao inserir usuário:", err.message);
            return res
              .status(500)
              .json({ message: "Erro interno ao registrar usuário." });
          }

          console.log(
            `Usuário ${email} registrado com sucesso. ID: ${this.lastID}`
          );
          res.status(201).json({
            message: "Usuário criado com sucesso!",
            userId: this.lastID,
          });
        }
      );
    });
  } catch (error) {
    console.error("Erro inesperado no registro:", error);
    res.status(500).json({ message: "Erro inesperado no servidor." });
  }
});

router.post("/login", (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: "Email e senha são obrigatórios." });
  }

  const sql = `SELECT id, nomeCompleto, email, passwordHash FROM Users WHERE email = ?`;
  db.get(sql, [email], async (err, user) => {
    if (err) {
      console.error("Erro ao buscar usuário:", err.message);
      return res
        .status(500)
        .json({ message: "Erro interno ao tentar fazer login." });
    }

    if (!user) {
      return res.status(401).json({ message: "Email ou senha inválidos." });
    }

    try {
      const match = await bcrypt.compare(senha, user.passwordHash);

      if (!match) {
        return res.status(401).json({ message: "Email ou senha inválidos." });
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error("Chave secreta JWT não definida no .env!");
        return res
          .status(500)
          .json({ message: "Erro interno de configuração do servidor." });
      }

      const payload = {
        userId: user.id,
        email: user.email,
      };

      jwt.sign(payload, secret, { expiresIn: "1h" }, (err, token) => {
        if (err) {
          console.error("Erro ao gerar token JWT:", err);
          return res
            .status(500)
            .json({ message: "Erro interno ao gerar autenticação." });
        }

        console.log(`Usuário ${user.email} logado com sucesso.`);
        res.status(200).json({
          message: "Login bem-sucedido!",
          token: token,
          user: {
            id: user.id,
            nomeCompleto: user.nomeCompleto,
            email: user.email,
          },
        });
      });
    } catch (compareError) {
      console.error("Erro ao comparar senhas:", compareError);
      res.status(500).json({ message: "Erro interno durante o login." });
    }
  });
});

module.exports = router;
