import { Router } from "express";
import {
  createShopifyOrder,
  getShopifyOrderDetails,
  getVariantInfo,
} from "../controllers/shopify.js";
import {
  sendEventToInterakt,
  sendPurchaseCommunication,
} from "../controllers/intrakat.js";
import InvoiceModel from "../../utils/models/InvoiceModel.js";

const razorpayRoutes = Router();

razorpayRoutes.post("/", async (req, res) => {
  try {
    const body = req.body;
    console.log("Razorpay webhook was triggered ✅");
    console.dir(body, { depth: null });
    const shop = process.env.STORE_HANDLE;
    const isInvoiceAlreadyProcessed = await InvoiceModel.findOne({
      id: body.payload?.payment?.entity?.id,
    });
    const invoice = new InvoiceModel({
      id: body.payload?.payment?.entity?.id,
    });
    await invoice.save();
    if (body?.event == "invoice.paid" && !isInvoiceAlreadyProcessed) {
      const structuredPayload = {
        variantId: body.payload?.payment?.entity?.notes?.variantId || null,
        customer: {
          phone:
            body.payload?.invoice?.entity?.customer_details?.contact || null,
          email: body.payload?.invoice?.entity?.customer_details?.email || null,
        },
        amount: body.payload?.invoice?.entity?.amount,
      };
      const variantDetails = await getVariantInfo(
        shop,
        structuredPayload.variantId
      );
      const shopifyOrder = await createShopifyOrder(shop, variantDetails, {
        email: structuredPayload.customer.email,
        phone: structuredPayload.customer.phone,
      });
      structuredPayload.customer.phone
        ? await sendPurchaseCommunication(structuredPayload.customer.phone)
        : "";
    }
    if (body?.event == "order.paid") {
      body?.payload?.payment?.entity?.contact
        ? await sendPurchaseCommunication(body.payload.payment.entity.contact)
        : null;
      setTimeout(async () => {
        const paymentId = body.payload.payment.entity.notes.shopify_order_id;
        const phoneNumber = body.payload.payment.entity.contact;
        const email = body.payload.payment.entity.email;
        if (!paymentId || !phoneNumber || !email) {
          console.log("Required parameters missing");
        }
        await sendEventToInterakt(paymentId, phoneNumber, email);
      }, 1000);
    }
    res.status(200).json({
      ok: true,
    });
  } catch (err) {
    console.log("Failed to handle razorpya route reason -->" + err.message);
    res.status(400).json({
      ok: false,
    });
  }
});

export default razorpayRoutes;
