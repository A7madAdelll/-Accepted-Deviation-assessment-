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

Create a `.env` file in the root:

```env
WOO_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxx
WOO_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxx
WOO_STORE_URL=https://your-store.com

ZOHO_CLIENT_ID=1000.xxxxxxxxxxxxxxxx
ZOHO_CLIENT_SECRET=xxxxxxxxxxxxxxxx
ZOHO_REFRESH_TOKEN=1000.xxxxxxxxxxxxxxxx
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

### Schedule

The function runs on a schedule configured in:
`Zoho CRM → Setup → Automation → Schedules`

Minimum frequency: **every 1 hour**

---

## WooCommerce API Setup

1. Go to **WooCommerce → Settings → Advanced → REST API**
2. Click **Add Key**
3. Set permissions to **Read**
4. Copy the `Consumer Key` and `Consumer Secret` into your `.env`

---

## Zoho OAuth Setup

1. Go to [Zoho API Console](https://api-console.zoho.com)
2. Create a **Self Client**
3. Generate a refresh token with scopes:
   - `ZohoCRM.modules.contacts.ALL`
   - `ZohoCRM.modules.deals.ALL`
4. Copy credentials into your `.env`

---

## Notes

- ngrok free tier generates a **new URL every restart** — update the Deluge function URL each time
- The `zohoController.js` uses an in-memory `Set` to avoid duplicate Deal creation within the same session
- The Deluge function does not currently track processed orders between runs — consider adding a Zoho CRM custom field or variable to handle this if duplicates become an issue