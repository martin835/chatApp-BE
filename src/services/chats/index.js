import express from "express";
import createError from "http-errors";
import ChatModel from "./chat-model.js";
import MessageModel from "./message-model.js";
import UserModel from "../users/model.js";
import mongoose from "mongoose";
import { JWTAuthMiddleware } from "../../auth/JWTMiddleware.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

const cloudStorageProd = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "Whatsapp-clone-chat-media",
  },
});
const cloudMulterAvatar = multer({
  storage: cloudStorageProd,
  limits: { fileSize: 3145728 },
});

const chatRouter = express.Router();

// ACTIVE ENDPOINT - 1 -  Returns all chats in which you are a member.
// Chat history doesn't get provided with this endpoint or the body payload would quickly become excessive.
//RESPONSES: 404 -Chat Not Found, 200 - Success, 401 - Unauthorized
chatRouter.get("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user._id);

    //console.log(req.user._id);

    const chats = await ChatModel.find({
      members: { $all: [req.user._id] },
    }).populate({ path: "members" });

    //console.log(chats);

    res.status(200).send(chats);
  } catch (error) {
    next(error);
  }
});

// ACTIVE ENDPOINT - 2 - This endpoint should check if the request sender already had an active chat
// with this recipient and return it if present.
//Otherwise, it creates a new chat among the request sender and the recipient the request body.
// When this happens, on the socket layer, this endpoint should
//also make sure that the sockets of both users
// are joining this newly created room
//(otherwise none of them would be listening to incoming messages to this room).
//RESPONSES: 200 Returning a previously existing chat  ;  201 Created a new chat

chatRouter.post("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    // 1 check if the request sender already has a chat with the recipient

    console.log("SENDER: ", req.user._id);
    console.log("RECIPIENT: ", req.body.recipient);
    const commonChats = await ChatModel.find({
      members: { $all: [req.user._id, req.body.recipient] },
    });

    console.log("These are common chats: ", commonChats);

    if (commonChats.length > 0) {
      // 2 - If common chat(s) exist - return messages from the first chat in the arr.
      res.status(200).send(commonChats);
    } else {
      // 3 - if chat doesn't exist, create a new chat
      const newChat = new ChatModel(req.body);
      const { _id } = await newChat.save();

      const recipient = mongoose.Types.ObjectId(req.body.recipient);
      const chat = await ChatModel.findByIdAndUpdate(
        { _id: mongoose.Types.ObjectId(_id) },
        { $addToSet: { members: { $each: [recipient, req.user._id] } } },
        { new: true }
      );
      console.log(chat);
      res.status(201).send(chat);
    }
  } catch (error) {
    next(error);
  }
});

// TESTING ENDPOINT for creating chats
// --> My ID I retrieve from JWT Token
// chatRouter.post("/create-chat", async (req, res, next) => {
//   try {
//     const newChat = new ChatModel(req.body);
//     const { _id } = await newChat.save();
//     console.log(req.body);
//     const recipient = mongoose.Types.ObjectId(req.body.recipient);
//     const chat = await ChatModel.findByIdAndUpdate(
//       { _id: mongoose.Types.ObjectId(_id) },
//       { $addToSet: { members: recipient } },
//       { new: true }
//     );
//     console.log(chat);
//     res.status(201).send(chat);
//   } catch (error) {
//     next(error);
//   }
// });

//TESTING ENDPOINT for getting all chats
// chatRouter.get("/get-chats", async (req, res, next) => {
//   try {
//     const chats = await ChatModel.find({})
//       .populate({ path: "members" })
//       .populate({ path: "messages" });

//     res.send(chats);
//   } catch (error) {
//     next(error);
//   }
// });

//ACTIVE ENDPOINT - 3 - Receives form-data, uploads file to cloudinary,
//sends back to FE URL of the media.

chatRouter.post(
  "/media",
  cloudMulterAvatar.single("media"),
  (req, res, next) => {
    try {
      console.log(req.file.path);
      res.status(201).send({ url: req.file.path });
    } catch (error) {
      next(error);
    }
  }
);

// ACTIVE ENDPOINT - 4 - Returns full message history for a specific chat

chatRouter.get("/:id", async (req, res, next) => {
  try {
    const chat = await ChatModel.findById(req.params.id)
      .populate({ path: "members" })
      .populate({ path: "messages" });

    if (chat) {
      res.status(200).send(chat);
    } else {
      next(createError(404, `Chat with id: ${req.params.id} not found`));
    }
  } catch (error) {
    next(error);
  }
});

//TESTING ENDPOINT for sending messages

// chatRouter.post("/:id/message", async (req, res, next) => {
//   try {
//     //1 - find chat with ID
//     console.log(req.params.id);
//     let chatToUpdate = await ChatModel.findById(req.params.id);

//     //2 - if chat exists - push a message to the messages

//     if (chatToUpdate) {
//       console.log("This is chat to update from params:  ", chatToUpdate);
//       console.log("This is request body: ", req.body);

//       const newMessage = new MessageModel(req.body);
//       const { _id } = await newMessage.save();

//       chatToUpdate = await ChatModel.findByIdAndUpdate(
//         { _id: mongoose.Types.ObjectId(req.params.id) },
//         { $push: { messages: _id } },
//         { new: true }
//       );

//       res.status(201).send(chatToUpdate);
//     } else {
//       res.status(404);
//     }
//   } catch (error) {
//     next(error);
//   }
// });

export default chatRouter;
