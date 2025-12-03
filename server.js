const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");
const { getPool, sql } = require("./db");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Configuração do Multer (upload em memória)
const upload = multer({ storage: multer.memoryStorage() });

// Configuração Azure Blob Storage
const sharedKey = new StorageSharedKeyCredential(
  process.env.AZURE_STORAGE_ACCOUNT,
  process.env.AZURE_STORAGE_KEY
);

const blobService = new BlobServiceClient(
  `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`,
  sharedKey
);

const container = blobService.getContainerClient(process.env.AZURE_STORAGE_CONTAINER);

// ========================
// Rotas
// ========================

// GET /invoices
app.get("/invoices", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM Invoices ORDER BY CreatedAt DESC");
    res.json(result.recordset);
  } catch (err) {
    console.error("ERRO AO BUSCAR INVOICES:", err);
    res.status(500).send({ error: err.message, stack: err.stack });
  }
});

// POST /invoices
app.post("/invoices", upload.single("file"), async (req, res) => {
  try {
    let fileUrl = null;

    // Upload para o Azure Blob Storage
    if (req.file) {
      const blobName = Date.now() + "-" + req.file.originalname;
      const blockBlob = container.getBlockBlobClient(blobName);
      await blockBlob.uploadData(req.file.buffer);
      fileUrl = blockBlob.url;
    }

    // Dados do formulário
    const { title, date, valueWithVAT, valueWithoutVAT } = req.body;

    // Inserir na base de dados SQL
    const pool = await getPool();
    await pool.request()
      .input("title", sql.NVarChar, title)
      .input("date", sql.Date, date)
      .input("wvat", sql.Decimal(10,2), valueWithVAT)
      .input("woutvat", sql.Decimal(10,2), valueWithoutVAT)
      .input("file", sql.NVarChar, fileUrl)
      .query(`
        INSERT INTO Invoices (Title, InvoiceDate, ValueWithVAT, ValueWithoutVAT, AttachmentUrl)
        VALUES (@title, @date, @wvat, @woutvat, @file)
      `);

    res.send("Invoice criada com sucesso!");
  } catch (err) {
    console.error("ERRO AO CRIAR INVOICE:", err);
    res.status(500).send({ error: err.message, stack: err.stack });
  }
});

// ========================
// Iniciar servidor
// ========================
const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Servidor a correr na porta " + port));
