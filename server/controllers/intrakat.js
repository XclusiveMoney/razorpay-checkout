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
          name: "order_confirmation_for_automation",
          languageCode: "en",
          bodyValues: [],
          headerValues:["https://interaktprodmediastorage.blob.core.windows.net/mediaprodstoragecontainer/6d505269-e105-47ab-a1ce-9842d325d4cb/message_template_media/GPusSy530P6Y/ChatGPT%20Image%20Feb%203%2C%202026%2C%2002_06_15%20PM.png?se=2031-01-28T08%3A36%3A27Z&sp=rt&sv=2019-12-12&sr=b&sig=GysNjt1r4qNl/ktluHW/8rO9RPFwxIH5AMXfF/HIT6U%3D"]
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
