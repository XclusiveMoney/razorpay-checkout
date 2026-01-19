import Razorpay from "razorpay";
import { createShopifyOrder, getVariantInfo } from "./shopify.js";

/**
 * @param {string} shop - shopify store handle xclusivemoney.myshopify.com
 * @param {string} variantId - shopify variant id
 */
const handleRazorpayCheckout = async (shop, variantId) => {
  try {
    const variantData = await getVariantInfo(shop, variantId);
    const shopifyOrder = await createShopifyOrder(shop, variantData);
    const plan = await createRazorPayPlan(variantData);
    const subscription = await createRazorPaySubscription(plan);
    return {
      ...subscription,
      amount: variantData.amount,
      order: shopifyOrder
    };
  } catch (err) {
    console.log(err)
    throw new Error(
      "Failed to handle razorpay checkout reason -->" + err.message
    );
  }
};

/**
 *
 * @typedef {object} payload
 * @param {string} title - variant title
 * @param {string} period - Enums ["daily","weekly","monthly","yearly"]
 * @param {number} interval - Number of times customer should be charged
 * @param {number} price - amount to be charged
 */
const createRazorPayPlan = async ({ title, period, interval, price }) => {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    instance.paymentLink;
    const plan = await instance.plans.create({
      period,
      interval,
      item: {
        name: title,
        amount: price,
        currency: "INR",
        description: "",
      },
    });
    return plan;
  } catch (err) {
    console.log("failed here first ---======---->><<<<", err);
    throw new Error("Failed to create razorpay plan reason -->" + err.message);
  }
};

const createRazorPaySubscription = async (plan) => {
  try {
    var instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const subscription = await instance.subscriptions.create({
      plan_id: plan.id,
      customer_notify: true,
      quantity: 1,
      total_count: 1,
      addons: [],
      notes: {},
    });
    return subscription;
  } catch (err) {
    console.log(err);
    throw new Error(
      "Failed to create razorpya subscription reason -->" + err.message
    );
  }
};

const handleRzorpaySuccess = async (shop, variantId) => {
  try {
    if (!shop || !variantId) {
      throw new Error("Required parameters missing");
    }
    const variantData = await getVariantInfo(shop, variantId);
    const shopifyOrder = await createShopifyOrder(shop, variantData);
    return shopifyOrder;
  } catch (err) {
    throw new Error(
      "Failed to handle razorpay success reason -->" + err.message
    );
  }
};
export { handleRazorpayCheckout, handleRzorpaySuccess };
