const express = require("express");
const axios = require("axios");
const https = require("https");

const app = express();
const PORT = 3000;

// Woo credentials
const wooUser = " ";
const wooPass = " ";

const wooLink = `https://accepteddeviation.local/wp-json/wc/v3/orders?consumer_key=${wooUser}&consumer_secret=${wooPass}`;

// ignore self-signed SSL (local)
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
});

// API endpoint
app.get("/orders", async (req, res) => {
  try {
    const response = await axiosInstance.get(wooLink);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching WooCommerce orders:", error.message);
    res.status(500).json({
      error: "Failed to fetch WooCommerce orders",
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
