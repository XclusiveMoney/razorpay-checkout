import { Router } from "express";
import { handleRazorpayCheckout, handleRzorpaySuccess } from "../../controllers/razorpay.js";

const customCheckoutRoutes = Router();


customCheckoutRoutes.post("/success",async(req,res) =>{
  try{
     const payload = req.body;
    const shop = res.locals.user_shop;
    if (!payload?.variantId) {
      throw new Error("Required parameters missing");
    };
    const order = await handleRzorpaySuccess(shop,payload.variantId);
    res.status(200).json({
      ok: true,
      ...order
    });
  }catch(err){
    res.status(400).json({
      ok: false
    })
  }
})
customCheckoutRoutes.post("/", async (req, res) => {
  try {
    const payload = req.body;
    const shop = res.locals.user_shop;
    if (!payload?.variantId) {
      throw new Error("Required parameters missing");
    }
    const subscription = await handleRazorpayCheckout(shop, payload.variantId);
    res.status(200).json(JSON.stringify(subscription));
  } catch (err) {
    console.error(
      "Failed to handle custom checkout post routes reason -->" + err.message
    );
    res.status(400).json({
      ok: false,
    });
  }
});

export default customCheckoutRoutes;
