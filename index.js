const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
require("dotenv").config();

//Cnfigure ports
const args = process.argv;
const p_index = args.indexOf("--p");
const cp_index = args.indexOf("--cp");
const PORT = p_index !== -1 ? args[p_index + 1] : process.env.PORT || 5000;
const CLIENT_PORT =
  cp_index !== -1 ? args[cp_index + 1] : process.env.CLIENT_PORT || 3000;

const ap = express();
ap.use(
  cors({
    origin: `http://localhost:${CLIENT_PORT}`,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

ap.use(express.json());
ap.use(bodyParser.urlencoded({ extended: true }));

ap.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

const db = new sqlite3.Database("softserve.db", (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to  database.");
});

// CREATE
ap.post("/products", (req, res) => {
  const { name, price } = req.body;
  if (typeof name === undefined || price === undefined) {
    res.status(400).json({ error: "Invalid data format" });
    return;
  }

  const sql = `INSERT INTO products (name,  price) VALUES (?, ?)`;
  db.run(sql, [name, price], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({
      message: "Product added successfully.",
      productId: this.lastID,
    });
  });
});

// READ all
ap.get("/products", (req, res) => {
  const sql = `SELECT * FROM products`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// READ once
ap.get("/products/:id", (req, res) => {
  const id = req.params.id;
  const sql = `SELECT * FROM products WHERE id = ? `;
  db.get(sql, id, (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(row);
  });
});

// UPDATE
ap.patch("/products/:id", (req, res) => {
  const id = req.params.id;
  const selectSqlGet = "SELECT name, price FROM products WHERE id = ?";
  db.get(selectSqlGet, [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    const name = req.body.name || row.name;
    const price = req.body.price || row.price;
    const sqlWrite = `UPDATE products SET name = ?, price = ? WHERE id = ?`;
    db.run(sqlWrite, [name, price, id], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        message: "Product updated successfully.",
      });
    });
  });
});

// DELETE
ap.delete("/products/:id", (req, res) => {
  const id = req.params.id;
  const sql = `DELETE FROM products WHERE id = ?`;
  db.run(sql, id, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json({
      message: "Product deleted successfully.",
    });
  });
});
