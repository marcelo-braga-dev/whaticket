import express from "express";
import multer from "multer";
import uploadConfig from "../config/upload";

import * as ApiController from "../controllers/ApiController";
import * as UserController from "../controllers/UserController";
import isAuthApi from "../middleware/isAuthApi";

const upload = multer(uploadConfig);

const ApiRoutes = express.Router();

ApiRoutes.post("/send", isAuthApi, upload.array("medias"), ApiController.index);

ApiRoutes.post(
  "/user",
  isAuthApi,
  upload.array("medias"),
  UserController.apiStore
);

ApiRoutes.post(
  "/contacts",
  isAuthApi,
  upload.array("medias"),
  ApiController.createContactApi
);

export default ApiRoutes;
