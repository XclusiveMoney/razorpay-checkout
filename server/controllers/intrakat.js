import fetch from "node-fetch";
import { getShopifyOrderDetails } from "./shopify.js";

const sendPurchaseCommunication = async (phone) => {
  try {
    if (!phone) {
      throw new Error("Can't send without phone number");
    }
    const normalisedPhone = phone.includes("+91")
      ? phone.replace("+91", "")
      : phone;
    const url = `https://api.interakt.ai/v1/public/message/`;
    const request = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${process.env.INTRAKAT_API}`,
      },
      body: JSON.stringify({
        countryCode: "+91",
        phoneNumber: normalisedPhone,
        callbackData: "some text here",
        type: "Template",
        template: {
          name: "order_confirmation_for_automation",
          languageCode: "en",
          bodyValues: [],
          headerValues: [
            "https://interaktprodmediastorage.blob.core.windows.net/mediaprodstoragecontainer/6d505269-e105-47ab-a1ce-9842d325d4cb/message_template_media/GPusSy530P6Y/ChatGPT%20Image%20Feb%203%2C%202026%2C%2002_06_15%20PM.png?se=2031-01-28T08%3A36%3A27Z&sp=rt&sv=2019-12-12&sr=b&sig=GysNjt1r4qNl/ktluHW/8rO9RPFwxIH5AMXfF/HIT6U%3D",
          ],
        },
      }),
    });

    const res = await request.json();
    console.log(res);
    return res;
  } catch (err) {
    throw new Error(
      "Failed to send purchase communication reason -->" + err.message
    );
  }
};

const sendEventToInterakt = async (paymentId, phoneNumber, email) => {
  try {
    const shop = "idpzuz-xs.myshopify.com";

    const orderDetails = await getShopifyOrderDetails(shop, paymentId);
    let variantData = orderDetails?.lineItems?.edges[0]?.node || {};
    const eventPayload = {
      event: "order placed v2",
      phoneNumber: phoneNumber.replace("+91"),
      countryCode: "+91",
      traits: {
        createdAt: orderDetails.createdAt,
        name: orderDetails.customer.displayName,
        customerShopifyId: orderDetails.customer.id.replace(
          "gid://shopify/Customer/",
          ""
        ),
        discountCode: orderDetails.discountCode,
        discountValue: Number(orderDetails.totalDiscountsSet.shopMoney.amount),
        customerEmail: email,
        price: Number(variantData.variant.price),
        title: variantData.title,
        variantId: variantData.variant.id.replace(
          "gid://shopify/ProductVariant/",
          ""
        ),
        amountSpent: Number(orderDetails.totalPriceSet.shopMoney.amount),
      },
    };
    const url = `https://api.interakt.ai/v1/public/track/events/`;
    const request = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${process.env.INTRAKAT_API}`,
      },
      body: JSON.stringify(eventPayload),
    });

    const res = await request.json();
    console.dir(res, { depth: null });
  } catch (err) {
    console.log("Failed to send event to interakt reason -->" + err.message);
  }
};

const registerCustomerInInterakt = async ({
  firstName,
  lastName,
  phone,
  email,
  totalSpent,
  totalOrders,
  customerId,
}) => {
  try {
    const payload = {
      countryCode: "+91",
      phoneNumber: phone.replace("+91", ""),
      traits: {
        name: `${firstName} ${lastName}`,
        email: email,
        first_name: firstName,
        last_name: lastName,
        total_spent: totalSpent,
        totalSpends: totalSpent,
        "Total Spent": totalSpent,
        total_orders_count: totalOrders,
        shopify_customer_id: customerId,
      },
    };
    const url = `https://api.interakt.ai/v1/public/track/users/`;
    const request = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${process.env.INTRAKAT_API}`,
      },
      body: JSON.stringify(payload),
    });
    const res = await request.json();
    if (!res.result) {
      throw new Error("Failed to register customer in interakt");
    }
    return res;
  } catch (err) {
    throw new Error(
      "Failed to handle customer registeration in interakt reason -->" +
        err.message
    );
  }
};
const sendOrderPlacedEventToInterakt = async ({
  phoneNumber,
  orderDetails,
}) => {
  try {
    const eventPayload = {
      event: "order placed v2",
      phoneNumber: phoneNumber.replace("+91"),
      countryCode: "+91",
      traits: {
        createdAt: orderDetails.created_at,
        discountCode: orderDetails.discount_codes
          .map((el) => el.code)
          .join(" "),
        discountValue: Number(orderDetails.discount_codes[0].amount),
        price: Number(orderDetails.line_items[0].price),
        title: orderDetails.line_items[0].variant_title,
        variantId: orderDetails.line_items[0].variant_id,
        amountSpent: Number(orderDetails.total_price),
      },
    };
    const url = `https://api.interakt.ai/v1/public/track/events/`;
    const request = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${process.env.INTRAKAT_API}`,
      },
      body: JSON.stringify(eventPayload),
    });

    const res = await request.json();
    if (!res.result) {
      throw new Error("Failed to send order placed event to interakt");
    }
    return res;
  } catch (err) {
    throw new Error(
      "Failed to send order placed event to interakt reason -->" + err.message
    );
  }
};
export {
  sendPurchaseCommunication,
  sendEventToInterakt,
  registerCustomerInInterakt,
  sendOrderPlacedEventToInterakt,
};
