import { sendPurchaseCommunication } from "../controllers/intrakat.js";

const orderCreateHandler = async (
  topic,
  shop,
  webhookRequestBody,
  webhookId,
  apiVersion
) => {
  /** @type {webhookTopic} */
  const webhookBody = JSON.parse(webhookRequestBody);
  // sendPurchaseCommunication(webhookBody.phone);
};

export default orderCreateHandler;
