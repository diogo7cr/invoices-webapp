const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");
const { getPool, sql } = require("./db");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Upload config
const upload = multer({ storage: multer.memoryStorage() });

// Blob Storage client
const sharedKey = new StorageSharedKeyCredential(
  process.env.STORAGE_ACCOUNT,
  process.env.STORAGE_ACCOUNT_KEY
);

const blobService = new BlobServiceClient(
  `https://${process.env.STORAGE_ACCOUNT}.blob.core.windows.net`,
  sharedKey
);

const container = blobService.getContainerClient(process.env.STORAGE_CONTAINER);

// GET invoices
app.get("/invoices", async (req, res) => {
  const pool = await getPool();
  const result = await pool.request().query("SELECT * FROM Invoices ORDER BY CreatedAt DESC");
  res.json(result.recordset);
});

// POST invoice
app.post("/invoices", upload.single("file"), async (req, res) => {
  let fileUrl = null;

  if (req.file) {
    const blobName = Date.now() + "-" + req.file.originalname;
    const blockBlob = container.getBlockBlobClient(blobName);
    await blockBlob.uploadData(req.file.buffer);
    fileUrl = blockBlob.url;
  }

  const { title, date, valueWithVAT, valueWithoutVAT } = req.body;

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

  res.send("Invoice criada");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Servidor a correr na porta " + port));
