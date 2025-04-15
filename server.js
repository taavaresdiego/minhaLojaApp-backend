require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const db = require("./src/database");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const chatRoutes = require("./routes/chat");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Backend Minha Loja App está rodando!" });
});
console.log(">>> Montando rotas /api/auth...");
app.use("/api/auth", authRoutes);
console.log(">>> Montando rotas /api/products...");
app.use("/api/products", productRoutes);
console.log(">>> Montando rotas /api/orders...");
app.use("/api/orders", orderRoutes);
console.log(">>> Montando rotas /api/chat...");
app.use("/api/chat", chatRoutes);

io.on("connection", (socket) => {
  console.log(`[Socket.IO] Usuário conectado: ${socket.id}`);

  socket.on("liveChatMessage", (msg) => {
    console.log(
      `[Socket.IO] Mensagem 'liveChatMessage' recebida (${socket.id}): `,
      msg
    );

    if (msg && msg.text && msg.senderName) {
      const messageToSend = {
        id: Date.now().toString() + "-" + socket.id.substring(0, 4),
        ...msg,
        timestamp: new Date(),
      };
      socket.broadcast.emit("liveChatMessage", messageToSend);
      console.log("[Socket.IO] Mensagem retransmitida para OUTROS.");
    } else {
      console.log("[Socket.IO] Mensagem recebida inválida ou incompleta.");
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.IO] Usuário desconectado: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor backend (HTTP + Socket.IO) rodando na porta ${PORT}`);
});

process.on("SIGINT", () => {
  console.log("Recebido SIGINT. Fechando conexões...");
  db.close((err) => {
    if (err) {
      console.error("Erro ao fechar banco de dados:", err.message);
    } else {
      console.log("Conexão com o banco de dados SQLite fechada.");
    }
    io.close(() => {
      console.log("Servidor Socket.IO fechado.");
      server.close(() => {
        console.log("Servidor HTTP fechado.");
        process.exit(0);
      });
    });
  });
});
