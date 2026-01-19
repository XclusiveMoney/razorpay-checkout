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

const createShopifyOrder = async (shop, variantData) => {
  try {
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
                amount: variantData.price/100,
                currencyCode: "INR",
              },
            },
            quantity: 1,
          },
        ],
        transactions: [
          {
            kind: "SALE",
            status: "PENDING",
            amountSet: {
              shopMoney: {
                amount: variantData.price/100,
                currencyCode: "INR",
              },
            },
          },
        ],
      },
    };
    const {data,errors,extensions} = await client.request(query,{variables});
    if(errors?.length >= 0){
      throw new Error("Failed to create order reason -->" + errors[0]);
    };
    if(data.orderCreate.userErrors.length > 0){
      throw new Error("Failed to create order")
    }
    return data.orderCreate.order;
  } catch (err) {
    console.log(err)
    throw new Error("Failed to create shopify order reason -->" + err.message);
  }
};
export { getVariantInfo,createShopifyOrder };
