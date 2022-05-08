import express from "express";
import createError from "http-errors";
import UsersModel from "./model.js";
import { generateAccessToken } from "../../auth/tools.js";
import { JWTAuthMiddleware } from "../../auth/JWTMiddleware.js";
import q2m from "query-to-mongo";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

const usersRouter = express.Router();

const cloudStorageProd = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "Whatsapp-clone-avatar",
  },
});
const cloudMulterAvatar = multer({
  storage: cloudStorageProd,
  limits: { fileSize: 3145728 },
});

usersRouter.post("/account", async (req, res, next) => {
  try {
    const newUser = new UsersModel(req.body);
    const { _id, username } = await newUser.save();
    const accessToken = await generateAccessToken({
      _id: _id,
      username: username,
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/session", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await UsersModel.checkCredentials(email, password);

    if (user) {
      const accessToken = await generateAccessToken({
        _id: user._id,
        username: user.username,
      });

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      });

      res.status(200).send();
    } else {
      next(createError(401, `Credentials are not ok!`));
    }
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const mongoQuery = q2m(req.query);
    const user = await UsersModel.find({
      username: { $regex: mongoQuery.criteria.q, $options: "i" },
    });
    if (user) {
      res.send(user);
    } else {
      next(404, `User with id ${req.user._id} not found!`);
    }
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.user._id);
    if (user) {
      res.send(user);
    } else {
      next(404, `User with id ${req.user._id} not found!`);
    }
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/:id", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.params.id);
    if (user) {
      res.status(200).send(user);
    } else {
      next(404, `User with id ${req.params.id} not found!`);
    }
  } catch (error) {
    next(error);
  }
});

usersRouter.post(
  "/me/avatar",
  JWTAuthMiddleware,
  cloudMulterAvatar.single("avatar"),
  async (req, res, next) => {
    try {
      const user = await UsersModel.findByIdAndUpdate(
        req.user._id,
        { avatar: req.file.path },
        { new: true }
      );

      res.send(user);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

usersRouter.put("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const updatedUser = await UsersModel.findByIdAndUpdate(
      req.user._id,
      req.body,
      { new: true }
    );
    if (updatedUser) {
      res.send(updatedUser);
    } else {
      next(404, `User with id ${req.user._id} not found!`);
    }
  } catch (error) {
    next(error);
  }
});

usersRouter.delete("/session", JWTAuthMiddleware, async (req, res, next) => {
  try {
    res.clearCookie("accessToken").send();
  } catch (error) {
    res.status(400).send();
  }
});

export default usersRouter;
