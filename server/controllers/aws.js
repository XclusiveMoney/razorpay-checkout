import AWS from "aws-sdk";

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});
/**
 *
 * @typedef {object} payload
 * @param {string} orderId - shopify order id
 * @param {object} result - error object
 */
const sendMessageFailureToDynamoDb = async ({
  orderId,
  error,
  orderDetails,
}) => {
  try {
    const dynamo = new AWS.DynamoDB();

    await dynamo
      .putItem({
        TableName: "ORDER_FAILURES",
        Item: {
          ORDER_ID: { S: `${orderId}` },
          CREATED_AT: { N: String(Date.now()) },
          error: error,
          retryCount: { N: "0" },
          errorPayload: { S: JSON.stringify(orderDetails) },
          status: { S: "FAILED" },
          createdAt: { S: new Date().toISOString() },
        },
        ConditionExpression: "attribute_not_exists(PK)",
      })
      .promise();
  } catch (err) {
    console.error("DYNAMODB_WEBHOOK_FAILURE_WRITE_FAILED", {
      orderId,
      error: err.message,
    });
  }
};
export { sendMessageFailureToDynamoDb };
