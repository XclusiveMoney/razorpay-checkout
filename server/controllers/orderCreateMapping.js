/**
 *
 * @param {string} shop - shopify store handle
 * @param {object} payload - order payload
 */

import { sendMessageFailureToDynamoDb } from "./aws.js";
import {
  registerCustomerInInterakt,
  sendOrderPlacedEventToInterakt,
} from "./intrakat.js";
import { getCustomerDataViaRazorpayPaymentId } from "./razorpay.js";
import {
  getCustomerRelatedInfoFromShopify,
  getPaymentIdOfOrder,
  updateCustomerPhoneOnShopify,
} from "./shopify.js";

const orderCreateMapping = async (shop, payload) => {
  try {
    const paymentId = await getPaymentIdOfOrder(
      shop,
      payload.admin_graphql_api_id
    );
    const shopifyCustomerInfo = await getCustomerRelatedInfoFromShopify(
      shop,
      payload.customer.id
    );
    const customerInfo = await getCustomerDataViaRazorpayPaymentId(paymentId);
    const compiledCustomerInfo = {
      ...shopifyCustomerInfo,
      ...customerInfo,
      customerId: payload.customer?.id || "",
    };
    const interaktRegisteration =
      await registerCustomerInInterakt(compiledCustomerInfo);
    await sendOrderPlacedEventToInterakt({
      phoneNumber: compiledCustomerInfo.phone,
      orderDetails: payload,
    });
    console.log("✅ Succesfully handled order creation webhook");
    if (!payload.customer.phone) {
      console.log(
        `Phone number not registered so we are manually inserting one 📞`
      );
      await updateCustomerPhoneOnShopify(
        shop,
        payload.customer.id,
        customerInfo.phone
      );
    }
  } catch (err) {
    await sendMessageFailureToDynamoDb({
      orderId: payload.order_number,
      orderDetails: payload,
      err: err.message,
    });
    console.log("❌ Failed to handle order creation reason -->" + err.message);
  }
};
export default orderCreateMapping;
