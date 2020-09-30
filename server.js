/**
 * import modules
 */
const express = require("express");
const mongoose = require("mongoose");
const Messages = require("./models/dbMessageModel");
const Owner = require("./models/messageOwnerModel");
const Pusher = require("pusher");
const cors = require("cors");
/**
 * app config
 */
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1072014",
  key: "529e8aa903eb562ca7e6",
  secret: "09a8d8f28d03bec513aa",
  cluster: "ap2",
  encrypted: true
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("DB is connected");

  const msgCollection = db.collection("messagecontent");
  const changeStream = msgCollection.watch();

  changeStream.on("change", change => {
    if (change.operationType == "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        from: messageDetails.from,
        messageRoomId: messageDetails.messageRoomId,
        message: messageDetails.message,
        timestamp: messageDetails.created_on || messageDetails.updatedAt
      });
    } else {
      console.log("Error triggering Pusher");
    }
  });
});

/**
 * middleware
 */
app.use(cors());
app.use(express.json());

/**
 * DB config
 */
const connection_url =
  "mongodb+srv://whatsappUser:hBsb6FPnl8Ct4Kb0@cluster0.enf2x.mongodb.net/whatsappdb?retryWrites=true&w=majority";

mongoose.connect(connection_url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
});

/**
 * api routes
 */
app.get("/", (req, res) => res.status(200).send("Hello World"));

const findMessages = messageId => {
  return new Promise((resolve, reject) => {
    Messages.find({ messageRoomId: messageId })
      .lean()
      .then(Response => {
        if (Response == null) {
          resolve(false);
        } else {
          resolve(Response);
        }
      })
      .catch(err => {
        reject(err._message);
      });
  });
};

const getContacts = phone => {
  return new Promise((resolve, reject) => {
    Owner.find({ phone: { $ne: phone } })
      .lean()
      .then(Response => {
        if (Response == null) {
          resolve(false);
        } else {
          resolve(Response);
        }
      })
      .catch(err => {
        reject(err._message);
      });
  });
};

const findDetails = phone => {
  return new Promise((resolve, reject) => {
    Owner.find({ phone: phone })
      .lean()
      .then(Response => {
        if (Response == null) {
          resolve(false);
        } else {
          resolve(Response);
        }
      })
      .catch(err => {
        reject(err._message);
      });
  });
};

const findAndUpdate = data => {
  // Find the document that describes set of phones
  const query = { phone: { $in: [data.phone1, data.phone2] } }
  
  // Set some fields in that document
  const update = { $push: { "contacts": data.contacts } };

  // Return the updated document instead of the original document
  const options = { upsert: true };

  return new Promise((resolve, reject) => {
    Owner.updateMany(query, update, options)
      .then(Response => {
        if (Response == null) {
          resolve(false);
        } else {
          resolve(Response);
        }
      })
      .catch(err => {
        reject(err._message);
      });
  });
};

/**
 * getting all the messages for a message ID
 */
app.get("/messages/sync", (req, res) => {
  findMessages(req.query.messageId)
    .then(Response => {
      if (Response !== null) {
        res.status(200).send(Response);
      } else {
        res.status(500).send("Error happened");
      }
    })
    .catch(error => {
      res.status(500).send("Error happened ", error);
    });
});

/**
 * registrating new user
 */
app.post("/messages/createDetails", (req, res) => {
  const dbDetails = req.body;

  Owner.create(dbDetails, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

/**
 * get all contacts
 */
app.get("/messages/getContacts", (req, res) => {
  getContacts(req.query.phone)
    .then(Response => {
      if (Response !== null) {
        res.status(200).send(Response);
      } else {
        res.status(500).send("Error happened");
      }
    })
    .catch(error => {
      res.status(500).send("Error happened ", error);
    });
});

/**
 * getting details of person
 */
app.get("/messages/getDetails", (req, res) => {
  findDetails(req.query.phone)
    .then(Response => {
      if (Response !== null) {
        res.status(200).send(Response);
      } else {
        res.status(500).send("Error happened");
      }
    })
    .catch(error => {
      res.status(500).send("Error happened ", error);
    });
});

/**
 * updating owner data with new messageRoom ID
 */
app.put("/messages/update", (req, res) => {
  const dbContacts = req.body;

  findAndUpdate(dbContacts)
    .then(Response => {
      if (Response !== null) {
        res.status(200).send(Response);
      } else {
        res.status(500).send("Error happened");
      }
    })
    .catch(error => {
      res.status(500).send("Error happened ", error);
    });
});

/**
 * creating new messages
 */
app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

/**
 * listen to port
 */
app.listen(port, () => console.log(`Listening on localhost: ${port}`));
