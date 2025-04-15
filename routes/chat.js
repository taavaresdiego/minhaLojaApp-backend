// Arquivo: routes/chat.js (Backend - Rota /ai APRIMORADA com Itens do Pedido)

const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const authMiddleware = require("../src/middleware/authMiddleware");
const db = require("../src/database");

const router = express.Router();

// --- Configuração do Gemini (como antes) ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAI;
let model;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
  console.log("SDK do Gemini inicializado com sucesso.");
} else {
  console.error(
    "ERRO CRÍTICO: Chave da API do Gemini (GEMINI_API_KEY) não encontrada no .env!"
  );
}
// ------------------------------------------

// Rota: POST /api/chat/ai (Aprimorada)
router.post("/ai", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const userMessage = req.body.message;

  console.log(
    `[Chat AI DB+] Mensagem recebida do usuário <span class="math-inline">\{userId\}\: "</span>{userMessage}"`
  );

  if (!userMessage) {
    return res.status(400).json({ message: "Nenhuma mensagem recebida." });
  }
  if (!model) {
    return res
      .status(500)
      .json({ message: "Configuração da IA indisponível." });
  }

  try {
    // --- 1. Buscar Dados Detalhados do Banco (Pedidos + Itens + Nomes de Produtos) ---
    const detailedOrdersSql = `
      SELECT
        O.id as orderId,
        strftime('%d/%m/%Y %H:%M', O.orderDate) as formattedDate,
        O.totalPrice,
        OI.quantity,
        OI.pricePerItem,
        P.nome as productName
      FROM Orders O
      JOIN OrderItems OI ON O.id = OI.orderId
      JOIN Products P ON OI.productId = P.id
      WHERE O.userId = ?
      ORDER BY O.orderDate DESC, O.id DESC, P.nome ASC
      LIMIT 15 -- Limita o número total de ITENS buscados (ajuste conforme necessário)
    `;
    // Esta query busca os últimos X *itens* de pedidos, ordenados pelo pedido mais recente.

    const orderDetails = await new Promise((resolve, reject) => {
      db.all(detailedOrdersSql, [userId], (err, rows) => {
        if (err) {
          console.error(
            "[Chat AI DB+] Erro ao buscar detalhes dos pedidos:",
            err.message
          );
          reject(err);
        } else {
          console.log(
            `[Chat AI DB+] Detalhes de itens encontrados para usuário ${userId}:`,
            rows ? rows.length : 0
          );
          resolve(rows || []);
        }
      });
    });
    // -------------------------------------------------------------------

    // --- 2. Formatar Contexto Detalhado ---
    let detailedOrderContext = "O usuário não possui pedidos recentes.";
    if (orderDetails && orderDetails.length > 0) {
      detailedOrderContext =
        "Histórico de itens dos pedidos recentes do usuário:\n";
      let currentOrderId = null;
      orderDetails.forEach((item) => {
        // Agrupa visualmente por pedido
        if (item.orderId !== currentOrderId) {
          if (currentOrderId !== null) detailedOrderContext += "\n"; // Linha extra entre pedidos
          detailedOrderContext += `--- Pedido #<span class="math-inline">\{item\.orderId\} \(</span>{item.formattedDate}) ---\n`;
          currentOrderId = item.orderId;
        }
        detailedOrderContext += `  - ${
          item.quantity
        }x <span class="math-inline">\{item\.productName\} @ R</span> ${item.pricePerItem.toFixed(
          2
        )}\n`;
      });
      // Poderia adicionar o Total do Pedido aqui também se desejado, buscando da tabela Orders separadamente ou adaptando a query.
    }
    console.log(
      "[Chat AI DB+] Contexto detalhado formatado:\n",
      detailedOrderContext
    );
    // -----------------------------------

    // --- 3. Construir o Prompt Completo ---
    const prompt = `Você é um assistente prestativo de um aplicativo de e-commerce. Responda à pergunta do usuário de forma concisa, utilizando APENAS as informações do histórico detalhado de itens de pedidos fornecido abaixo como contexto. Se a resposta não estiver no contexto, diga que não tem essa informação.\n\nContexto:\n${detailedOrderContext}\nPergunta do usuário: ${userMessage}`;
    console.log(
      `[Chat AI DB+] Enviando prompt para Gemini (Tamanho: ${prompt.length} caracteres)`
    );
    // ------------------------------------

    // --- 4. Chamar Gemini (como antes) ---
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = await response.text();
    console.log(`[Chat AI DB+] Resposta recebida do Gemini: "${aiText}"`);
    // -----------------------------------

    // --- 5. Enviar Resposta (como antes) ---
    res.status(200).json({ sender: "ai", text: aiText });
    // ---------------------------------
  } catch (error) {
    console.error("[Chat AI DB+] Erro no processamento:", error);
    if (error instanceof Error && error.message.includes("pedidos")) {
      // Verifica se erro foi na busca DB
      res
        .status(500)
        .json({ message: "Erro ao buscar histórico detalhado para a IA." });
    } else {
      res.status(500).json({ message: "Erro ao processar mensagem com a IA." });
    }
  }
});

module.exports = router;
