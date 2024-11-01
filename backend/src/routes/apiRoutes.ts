import express from "express";
import multer from "multer";
import uploadConfig from "../config/upload";

import * as ContactApiController from "../controllers/Api/ContactApiController";
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

ApiRoutes.get(
  "/tickets/status",
  isAuthApi,
  upload.array("medias"),
  ApiController.getTicketsByStatus
);

ApiRoutes.get(
  "/contact",
  isAuthApi,
  upload.array("medias"),
  ContactApiController.getContacts
);

export default ApiRoutes;
