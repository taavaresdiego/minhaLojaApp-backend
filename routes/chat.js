const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const authMiddleware = require("../src/middleware/authMiddleware");

const router = express.Router();

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

router.post("/ai", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const userMessage = req.body.message;

  console.log(
    `[Chat AI] Mensagem recebida do usuário ${userId}: "${userMessage}"`
  );

  if (!userMessage) {
    return res.status(400).json({ message: "Nenhuma mensagem recebida." });
  }

  if (!model) {
    return res
      .status(500)
      .json({ message: "Configuração da IA indisponível no servidor." });
  }

  try {
    const prompt = userMessage;

    console.log(`[Chat AI] Enviando prompt para Gemini: "${prompt}"`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = await response.text();
    console.log(`[Chat AI] Resposta recebida do Gemini: "${aiText}"`);

    res.status(200).json({
      sender: "ai",
      text: aiText,
    });
  } catch (error) {
    console.error("[Chat AI] Erro ao chamar API do Gemini:", error);
    res.status(500).json({ message: "Erro ao processar mensagem com a IA." });
  }
});

module.exports = router;
