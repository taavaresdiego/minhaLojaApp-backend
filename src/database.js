const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Erro ao abrir o banco de dados:", err.message);
    throw err;
  } else {
    console.log("Conectado ao banco de dados SQLite.");
    db.serialize(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nomeCompleto TEXT NOT NULL,
        cpf TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL
      )`,
        (err) => {
          if (err) console.error("Erro ao criar tabela Users:", err.message);
          else console.log("Tabela Users verificada/criada.");
        }
      );

      db.run(
        `CREATE TABLE IF NOT EXISTS Products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        preco REAL NOT NULL,
        descricao TEXT,
        imagemUrl TEXT
      )`,
        (err) => {
          if (err) {
            console.error("Erro ao criar tabela Products:", err.message);
          } else {
            console.log("Tabela Products verificada/criada.");
            db.get("SELECT COUNT(id) as count FROM Products", (err, row) => {
              if (!err && row.count === 0) {
                console.log("Populando tabela Products com dados iniciais...");
                const stmt = db.prepare(
                  "INSERT INTO Products (nome, preco, descricao, imagemUrl) VALUES (?, ?, ?, ?)"
                );
                const products = [
                  [
                    "Produto A (Backend)",
                    25.5,
                    "Descrição do Produto A vinda do backend.",
                    "https://picsum.photos/seed/100/200",
                  ],
                  [
                    "Produto B (Backend)",
                    199.99,
                    "Descrição do Produto B.",
                    "https://picsum.photos/seed/110/200",
                  ],
                  [
                    "Produto C",
                    15.0,
                    null,
                    "https://picsum.photos/seed/120/200",
                  ],
                  [
                    "Produto D",
                    78.25,
                    "Descrição D.",
                    "https://picsum.photos/seed/130/200",
                  ],
                ];
                products.forEach((p) => stmt.run(p));
                stmt.finalize((err) => {
                  if (!err)
                    console.log("Tabela Products populada com sucesso.");
                  else console.error("Erro ao popular Products:", err);
                });
              }
            });
          }
        }
      );

      db.run(
        `CREATE TABLE IF NOT EXISTS Orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        totalPrice REAL NOT NULL,
        orderDate TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id)
      )`,
        (err) => {
          if (err) console.error("Erro ao criar tabela Orders:", err.message);
          else console.log("Tabela Orders verificada/criada.");
        }
      );

      db.run(
        `CREATE TABLE IF NOT EXISTS OrderItems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderId INTEGER NOT NULL,
        productId INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        pricePerItem REAL NOT NULL,
        FOREIGN KEY (orderId) REFERENCES Orders(id),
        FOREIGN KEY (productId) REFERENCES Products(id)
      )`,
        (err) => {
          if (err)
            console.error("Erro ao criar tabela OrderItems:", err.message);
          else console.log("Tabela OrderItems verificada/criada.");
        }
      );
    });
  }
});

module.exports = db;
