const axiosLibrary = require("axios");
const { count, log } = require("console");
const https = require("https");

const wooUser = " ";
const wooPass = " ";
const wooLink = `https://accepteddeviation.local/wp-json/wc/v3/orders?consumer_key=${wooUser}&consumer_secret=${wooPass}`;

const zohoRefreshToken = " ";
const zohoClientId = " ";
const zohoClientSecret = " ";

let zohoAccessToken = " ";

const axios = axiosLibrary.create({
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
});

const refreshToken = async () => {
  try {
    const res = await axios.post(
      "https://accounts.zoho.com/oauth/v2/token",
      null,
      {
        params: {
          refresh_token: zohoRefreshToken,
          client_id: zohoClientId,
          client_secret: zohoClientSecret,
          grant_type: "refresh_token",
        },
      },
    );
    console.log(res.data);

    zohoAccessToken = res.data.access_token;
    console.log("Zoho access token refreshed.", zohoAccessToken);
  } catch (err) {
    console.error("Error refreshing Zoho token:", err.message);
  }
};

// storing orders to reduce apis calls and avoid duplicates in zoho
const processedOrders = new Set();

const getWooOrders = async () => {
  try {
    const res = await axios.get(wooLink);
    return res.data;
  } catch (err) {
    console.error("Error fetching WooCommerce orders:", err.message);
    return [];
  }
};

const upsert = async (customer) => {
  try {
    const res = await axios.post(
      "https://www.zohoapis.com/crm/v2/Contacts/upsert",
      {
        data: [
          {
            Last_Name: customer.last_name || "Unknown",
            First_Name: customer.first_name || "",
            Email: customer.email,
            Phone: customer.billing.phone,
          },
        ],
      },
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${zohoAccessToken}`,
          "Content-Type": "application/json",
        },
      },
    );
    const contactId = res.data.data[0].details.id;
    return contactId;
  } catch (err) {
    console.error("Error adding contact:", err.response?.data || err.message);
    return null;
  }
};

const addDeal = async (order, contactId) => {
  try {
    const res = await axios.post(
      "https://www.zohoapis.com/crm/v2/Deals",
      {
        data: [
          {
            Deal_Name: `Order #${order.id} - ${order.billing.first_name} ${order.billing.last_name}`,
            Stage: "waiting for shipping",
            Amount: order.total,
            Closing_Date: order.date_created.split("T")[0],
            Contact_Name: { id: contactId },
          },
        ],
      },
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${zohoAccessToken}`,
          "Content-Type": "application/json",
        },
      },
    );
    console.log(`Deal created for Order #${order.id}`);
    processedOrders.add(order.id);
  } catch (err) {
    console.error("Error creating deal:", err.response?.data || err.message);
  }
};

const processOrders = async () => {
  console.log("Fetching WooCommerce orders...");
  const orders = await getWooOrders();
  // console.log(orders);
  for (const order of orders) {
    if (processedOrders.has(order.id)) {
      console.log(`Order #${order.id} already processed. Skipping...`);
      continue;
    }

    const customer = order.billing;
    const contactId = await upsert({
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      billing: { phone: customer.phone },
    });

    if (contactId) {
      await addDeal(order, contactId);
    }
  }
};

refreshToken();
let counter = 1;
setInterval(() => {
  if (counter >= 5) {
    counter = 1;
    refreshToken();
  }
  processOrders();
  counter++;
}, 3000);
