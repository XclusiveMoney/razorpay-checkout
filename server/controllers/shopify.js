import clientProvider from "../../utils/clientProvider.js";

/**
 *
 * @param {string} shop - shopify store handle
 * @param {string} variantId - shopify variant id
 */
const getVariantInfo = async (shop, variantId) => {
  try {
    const normalisedVariantId = (variantId + "").includes("gid")
      ? variantId
      : `gid://shopify/ProductVariant/${variantId}`;
    const { client } = await clientProvider.offline.graphqlClient({ shop });
    const query = `query ProductVariantMetafield($namespace: String!, $key: String!, $ownerId: ID!){
            productVariant(id: $ownerId){
                title
                displayName
                price
                linerMaterial: metafield(namespace: $namespace, key: $key) {
                    value
                }
            }
        }`;
    const variables = {
      ownerId: normalisedVariantId,
      namespace: "custom",
      key: "plan",
    };
    const { data, errors, extensions } = await client.request(query, {
      variables,
    });
    if (errors && errors.length > 0) {
      throw new Error(
        "Failed to get variant metafield from shopify reason -->" + errors[0]
      );
    }
    if (!data?.productVariant?.linerMaterial?.value) {
      throw new Error("No metafield value present");
    }
    const metafieldData = JSON.parse(
      data?.productVariant?.linerMaterial?.value
    );
    return {
      title: data.productVariant.title,
      price: Number(data.productVariant.price) * 100,
      displayName: data.productVariant.displayName,
      ...metafieldData,
    };
  } catch (err) {
    throw new Error(
      "Failed to get variant plan info from metafield reason -->" + err.message
    );
  }
};

/**
 *
 * @param {string} shop - shopify store handle
 * @param {string} phoneNumber - customer phone number
 * @returns
 */
const checkIfCustomerExist = async (shop, phoneNumber) => {
  try {
    const { client } = await clientProvider.offline.graphqlClient({ shop });
    const query = `query($identifier : CustomerIdentifierInput!){
      customer: customerByIdentifier(identifier: $identifier){
        id
      }
    }`;
    const variables = {
      identifier: {
        phoneNumber: phoneNumber,
      },
    };
    const { data, extensions, errors } = await client.request(query, {
      variables,
    });
    if (errors && errors.length >= 1) {
      throw new Error("Failed to check existing customer");
    }
    return data.customer;
  } catch (err) {
    throw new Error(
      "Failed to check existing customer reason -->" + err.message
    );
  }
};
/**
 *
 * @param {string} shop - shopify store handle
 * @param {object} variantData - variant object
 * @param {object} customerDetails - customer details [email,phone]
 * @returns
 */
const createShopifyOrder = async (shop, variantData, customerDetails) => {
  try {
    const customer = await checkIfCustomerExist(shop, customerDetails.phone);
    console.log(customer);
    const { client } = await clientProvider.offline.graphqlClient({ shop });
    const query = `mutation orderCreate($order: OrderCreateOrderInput!){
      orderCreate(order: $order){
        userErrors{
          field
          message
        }
        order{
          id
          statusPageUrl(audience: CUSTOMERVIEW,notificationUsage: WEB)
        }
      }
    }`;
    const variables = {
      order: {
        currency: "INR",
        lineItems: [
          {
            title: variantData.displayName,
            priceSet: {
              shopMoney: {
                amount: variantData.price / 100,
                currencyCode: "INR",
              },
            },
            quantity: 1,
          },
        ],
        transactions: [
          {
            kind: "SALE",
            status: "SUCCESS",
            amountSet: {
              shopMoney: {
                amount: variantData.price / 100,
                currencyCode: "INR",
              },
            },
          },
        ],
      },
    };
    if (customer) {
      variables.order["customer"] = {
        toAssociate: {
          id: customer.id,
        },
      };
    } else {
      variables.order["customer"] = {
        toUpsert: {
          email: customerDetails.email,
          phone: customerDetails.phone,
        },
      };
    }
    console.log(variables);
    const { data, errors, extensions } = await client.request(query, {
      variables,
    });
    if (errors?.length >= 0) {
      throw new Error("Failed to create order reason -->" + errors[0]);
    }
    if (data.orderCreate.userErrors.length > 0) {
      throw new Error("Failed to create order");
    }
    console.log(data);
    return data.orderCreate.order;
  } catch (err) {
    console.log(err);
    throw new Error("Failed to create shopify order reason -->" + err.message);
  }
};

const getShopifyOrderDetails = async (shop, paymentId) => {
  try {
    const { client } = await clientProvider.offline.graphqlClient({ shop });
    const query = `query {
      orders(first: 1, query: "payment_id:${paymentId}"){
        edges{
          node{
            id
            createdAt
            customer{
              id
              displayName
            }
            discountCode
            totalPriceSet{
              shopMoney{
                amount
              }
            }
            lineItems(first: 10){
              edges{
                node{
                  id
                  title
                  variant{
                    price
                    id
                  }
                }
              }
            }
            totalDiscountsSet{
              shopMoney{
                amount
              }
            }
          }
        }
      }
    }`;
    const { data, extensions, errors } = await client.request(query);
    if (errors && errors.length > 0) {
      console.log("Failed", errors);
      throw new Error("Failed to get order details");
    }
    console.log("getting order details for", paymentId, data);
    if (data.orders.edges.length == 0) {
      throw new Error("No order found");
    }
    return data.orders.edges[0].node;
  } catch (err) {
    throw new Error(
      "Failed to get shopify order details reason -->" + err.message
    );
  }
};
export { getVariantInfo, createShopifyOrder, getShopifyOrderDetails };
