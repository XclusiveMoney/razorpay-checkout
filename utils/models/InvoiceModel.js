import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
});

const InvoiceModel = mongoose.model("invoice", invoiceSchema);

export default InvoiceModel;
