const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let whatsappSchema = new Schema(
  {
    message: String,
    from: String,
    messageRoomId: String
  },
  {
    timestamps: { createdAt: "created_on" }
  }
);

module.exports = mongoose.model(
  "messageContent",
  whatsappSchema,
  "messagecontent"
);
