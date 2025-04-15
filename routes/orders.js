const express = require("express");
const db = require("../src/database");
const authMiddleware = require("../src/middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const items = req.body.items;

  console.log(`Recebida requisição POST /api/orders do usuário ID: ${userId}`);
  console.log("Itens recebidos:", JSON.stringify(items, null, 2));

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message:
        'Requisição inválida. O campo "items" deve ser um array não vazio.',
    });
  }

  let calculatedTotalPrice = 0;
  try {
    items.forEach((item) => {
      if (
        !item.product ||
        typeof item.product.preco !== "number" ||
        typeof item.quantity !== "number" ||
        item.quantity <= 0
      ) {
        throw new Error("Formato de item inválido no carrinho.");
      }
      calculatedTotalPrice += item.product.preco * item.quantity;
    });
    calculatedTotalPrice = parseFloat(calculatedTotalPrice.toFixed(2));
    console.log(`Preço total calculado: ${calculatedTotalPrice}`);
  } catch (validationError) {
    return res.status(400).json({
      message: validationError.message || "Dados do carrinho inválidos.",
    });
  }

  db.serialize(() => {
    const insertOrderSql = `INSERT INTO Orders (userId, totalPrice) VALUES (?, ?)`;
    db.run(insertOrderSql, [userId, calculatedTotalPrice], function (err) {
      if (err) {
        console.error("Erro ao inserir na tabela Orders:", err.message);
        return res
          .status(500)
          .json({ message: "Erro interno ao criar pedido (Orders)." });
      }

      const orderId = this.lastID;
      console.log(`Pedido ${orderId} criado na tabela Orders.`);

      const insertItemSql = `INSERT INTO OrderItems (orderId, productId, quantity, pricePerItem) VALUES (?, ?, ?, ?)`;
      const stmt = db.prepare(insertItemSql);

      let itemInsertError = null;
      items.forEach((item) => {
        if (
          !item.product ||
          typeof item.product.id === "undefined" ||
          typeof item.product.preco !== "number"
        ) {
          console.error("Item inválido encontrado no carrinho:", item);
          itemInsertError = new Error(
            `Item inválido ou faltando ID/Preço: ${
              item.product?.nome || "Desconhecido"
            }`
          );
          return;
        }
        stmt.run(
          [orderId, item.product.id, item.quantity, item.product.preco],
          function (err) {
            if (err) {
              console.error(
                `Erro ao inserir item (Produto ID: ${item.product.id}) na tabela OrderItems:`,
                err.message
              );
              itemInsertError = err;
            } else {
              console.log(
                `Item ${this.lastID} (Produto ID: ${item.product.id}) adicionado ao pedido ${orderId}.`
              );
            }
          }
        );
      });

      stmt.finalize((finalizeErr) => {
        if (finalizeErr) {
          console.error(
            "Erro ao finalizar inserção de itens:",
            finalizeErr.message
          );
          itemInsertError = itemInsertError || finalizeErr;
        }

        if (itemInsertError) {
          db.run("DELETE FROM Orders WHERE id = ?", [orderId], () => {});
          return res
            .status(500)
            .json({ message: "Erro interno ao salvar itens do pedido." });
        } else {
          res
            .status(201)
            .json({ message: "Pedido criado com sucesso!", orderId: orderId });
        }
      });
    });
  });
});

module.exports = router;
