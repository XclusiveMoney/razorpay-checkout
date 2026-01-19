import nodebase64 from "nodejs-base64-converter";

const generateRazorPayAuthKey = () => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error("Required credentials are missing");
    }
    const base64Pass = nodebase64.encode(`${keyId}:${keySecret}`);
    return base64Pass;
  } catch (err) {
    throw new Error(
      "Failed to generate razorpay auth key reason -->" + err.message
    );
  }
};
export { generateRazorPayAuthKey };
