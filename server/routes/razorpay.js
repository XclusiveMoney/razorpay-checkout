import { Router } from "express";
import { createShopifyOrder, getVariantInfo } from "../controllers/shopify.js";
import { sendPurchaseCommunication } from "../controllers/intrakat.js";
import InvoiceModel from "../../utils/models/InvoiceModel.js";

const razorpayRoutes = Router();

razorpayRoutes.post("/", async (req, res) => {
  try {
    const body = req.body;
    const shop = process.env.STORE_HANDLE;
    const isInvoiceAlreadyProcessed = await InvoiceModel.findOne({id: body.payload?.payment?.entity?.id });
    console.log({
      message: "webhook was triggered",
      data: body,
    });
    const invoice = new InvoiceModel({
      id: body.payload?.payment?.entity?.id 
    });
    await invoice.save();
    if (body?.event == "invoice.paid" && !isInvoiceAlreadyProcessed){
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
  } catch (err) {
    console.log("Failed to handle razorpya route reason -->" + err.message);
    res.status(400).json({
      ok: false,
    });
  }
});

export default razorpayRoutes;
