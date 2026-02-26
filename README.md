# WooCommerce → Zoho CRM Sync

Automatically syncs orders from a WooCommerce store to Zoho CRM as Contacts and Deals.

---

## How It Works

1. **`woocommerce_end_point.js`** — Express server that fetches orders from WooCommerce and exposes them via a local `/orders` endpoint
2. **ngrok** — Tunnels the local Express server to a public URL so Zoho can reach it
3. **`zohoController.js`** — Polls WooCommerce orders and syncs them to Zoho CRM (Contacts + Deals)
4. **Zoho Deluge Function** — Scheduled function inside Zoho CRM that calls the ngrok URL and upserts Contacts and creates Deals

---

## Project Structure

```
zoho/
├── zohoController.js         # Main sync logic (Node.js)
├── woocommerce_end_point.js  # Express server exposing WooCommerce orders
├── package.json
└── .env                      # Environment variables (see setup below)
```

---

## Prerequisites

- Node.js v18+
- ngrok installed globally (`npm install -g ngrok`)
- A WooCommerce store with REST API enabled
- A Zoho CRM account with API credentials

---

## Installation

```bash
git clone <your-repo-url>
cd zoho
npm install
```

---

## Environment Variables

change the values of 

```env
const wooUser = "ck_xxx";
const wooPass = "cs_xxx";
const wooLink = `https://accepteddeviation.local/wp-json/wc/v3/orders?consumer_key=${wooUser}&consumer_secret=${wooPass}`;

const zohoRefreshToken =
  "xxx.xx";
const zohoClientId = "xx.xx";
const zohoClientSecret = "xxx";

let zohoAccessToken =
  "xxx.xxxx";

```

---

## Running the Project

You need **two terminals** running at the same time:

**Terminal 1 — Start the WooCommerce endpoint:**
```bash
npm run start-woo
```

**Terminal 2 — Start ngrok tunnel:**
```bash
npm run start-ngrok
```

Copy the ngrok public URL (e.g. `https://xxxx.ngrok-free.app`) and update it in:
- Your Zoho Deluge function (the `/orders` fetch URL)

**Optional — Run both with one command:**
```bash
npm install concurrently --save-dev
npm start
```

---

## Zoho CRM Setup

### Deluge Scheduled Function

A Deluge function (`getOrders`) is scheduled inside Zoho CRM to:
1. Refresh the Zoho OAuth access token
2. Fetch orders from the ngrok `/orders` endpoint
3. Upsert a **Contact** (using Email as duplicate check field)
4. Create a **Deal** linked to the Contact
5. copy this file in getOrders_Zoho.txt into your scheduled function


---

## Notes

- ngrok free tier generates a **new URL every restart** — update the Deluge function URL each time
- The `zohoController.js` uses an in-memory `Set` to avoid duplicate Deal creation within the same session
- The Deluge function does not currently track processed orders between runs — consider adding a Zoho CRM custom field or variable to handle this if duplicates become an issue



---
# all the functionalities made in node
 you can just run teh zohoController.js and just run the woocomerce 
 it contains
 - gets the orders from a key made in woocommerce
 - refresh the access tocken with the refresh token recieved from zoho console
 - calls zoho apis to save contacts the to save deals