import orderCreateMapping from "../controllers/orderCreateMapping.js";

const orderCreateHandler = async (
  topic,
  shop,
  webhookRequestBody,
  webhookId,
  apiVersion
) => {
  /** @type {webhookTopic} */
  const webhookBody = JSON.parse(webhookRequestBody);
  await orderCreateMapping(shop, webhookBody);
};

export default orderCreateHandler;
