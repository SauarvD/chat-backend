const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let whatsappSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    phone: String,
    contacts: Array
  },
  {
    timestamps: { createdAt: "created_on" }
  }
);

module.exports = mongoose.model("messageOwner", whatsappSchema, "messageowner");
