import fetch from "node-fetch";

const sendPurchaseCommunication = async (phone) => {
  try {
    if (!phone) {
      throw new Error("Can't send without phone number");
    }
    const normalisedPhone = phone.includes("+91")
      ? phone.replace("+91", "")
      : phone;
    const url = `https://api.interakt.ai/v1/public/message/`;
    const request = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${process.env.INTRAKAT_API}`,
      },
      body: JSON.stringify({
        countryCode: "+91",
        phoneNumber: normalisedPhone,
        callbackData: "some text here",
        type: "Template",
        template: {
          name: "postpurchase",
          languageCode: "en",
          bodyValues: [],
        },
      }),
    });

    const res = await request.json();
    console.log(res);
    return res;
  } catch (err) {
    throw new Error(
      "Failed to send purchase communication reason -->" + err.message
    );
  }
};

export { sendPurchaseCommunication };
