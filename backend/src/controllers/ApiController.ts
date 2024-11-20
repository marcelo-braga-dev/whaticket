import { Request, Response } from "express";
import * as Yup from "yup";
import { Op } from "sequelize";
import AppError from "../errors/AppError";
import GetDefaultWhatsApp from "../helpers/GetDefaultWhatsApp";
import SetTicketMessagesAsRead from "../helpers/SetTicketMessagesAsRead";
import Message from "../models/Message";
import Whatsapp from "../models/Whatsapp";
import CreateOrUpdateContactService from "../services/ContactServices/CreateOrUpdateContactService";
import FindOrCreateTicketService from "../services/TicketServices/FindOrCreateTicketService";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import CheckIsValidContact from "../services/WbotServices/CheckIsValidContact";
import CheckContactNumber from "../services/WbotServices/CheckNumber";
import GetProfilePicUrl from "../services/WbotServices/GetProfilePicUrl";
import SendWhatsAppMedia from "../services/WbotServices/SendWhatsAppMedia";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";

import Ticket from "../models/Ticket";
import User from "../models/User";

type WhatsappData = {
  whatsappId: number;
};

type MessageData = {
  body: string;
  fromMe: boolean;
  read: boolean;
  quotedMsg?: Message;
};

interface ContactData {
  number: string;
}

const createContact = async (
  whatsappId: number | undefined,
  newContact: string,
  name: string
) => {
  await CheckIsValidContact(newContact);

  const validNumber: any = await CheckContactNumber(newContact);

  const profilePicUrl = await GetProfilePicUrl(validNumber);

  const number = validNumber;

  const contactData = {
    name: `${name}`,
    number,
    profilePicUrl,
    isGroup: false
  };

  const contact = await CreateOrUpdateContactService(contactData);

  let whatsapp: Whatsapp | null;

  if (whatsappId === undefined) {
    whatsapp = await GetDefaultWhatsApp();
  } else {
    whatsapp = await Whatsapp.findByPk(whatsappId);

    if (whatsapp === null) {
      throw new AppError(`whatsapp #${whatsappId} not found`);
    }
  }

  const createTicket = await FindOrCreateTicketService(contact, whatsapp.id, 1);

  const ticket = await ShowTicketService(createTicket.id);

  SetTicketMessagesAsRead(ticket);

  return ticket;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const newContact: ContactData = req.body;
  const { whatsappId }: WhatsappData = req.body;
  const { body, quotedMsg }: MessageData = req.body;
  const medias = req.files as Express.Multer.File[];

  newContact.number = newContact.number.replace("-", "").replace(" ", "");

  const schema = Yup.object().shape({
    number: Yup.string()
      .required()
      .matches(/^\d+$/, "Invalid number format. Only numbers is allowed.")
  });

  try {
    await schema.validate(newContact);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const contactAndTicket = await createContact(whatsappId, newContact.number, newContact.number);

  if (medias) {
    await Promise.all(
      medias.map(async (media: Express.Multer.File) => {
        await SendWhatsAppMedia({ body, media, ticket: contactAndTicket });
      })
    );
  } else {
    await SendWhatsAppMessage({ body, ticket: contactAndTicket, quotedMsg });
  }

  return res.send();
};

export const createContactApi = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const newContact: ContactData = req.body;
  const { whatsappId }: WhatsappData = req.body;
  const { userId, name } = req.body;

  console.log(name)

  const numero = `${newContact.number}`;

  newContact.number = numero.replace(/[-\s]/g, "");

  const schema = Yup.object().shape({
    number: Yup.string()
      .required()
      .matches(/^\d+$/, "Invalid number format. Only numbers is allowed.")
  });

  try {
    await schema.validate(newContact);
    const contactAndTicket = await createContact(whatsappId, newContact.number, name);

    // Verificar se o usuário existe
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const ticket = await Ticket.findByPk(contactAndTicket.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket não encontrado" });
    }

    // Atribuir o ticket ao usuário e abrir o ticket
    ticket.userId = userId;
    ticket.status = "open";
    await ticket.save();

    return res.status(201).json({
      message: "Contato cadastrado com sucesso!",
      data: contactAndTicket
    });
  } catch (err: any) {
    // Capturando erros de validação ou de criação e enviando uma resposta de erro
    if (err instanceof Yup.ValidationError) {
      return res.status(400).json({ message: err.message });
    }
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    // Erro genérico para situações inesperadas
    console.error("Unexpected error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getTicketsByStatus = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { status = "open", userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "Vecê não está cadastrado." });
    }

    const userIdNumber = parseInt(userId as string, 10);

    if (isNaN(userIdNumber)) {
      return res
        .status(400)
        .json({ error: "O userId deve ser um número válido." });
    }

    const tickets = await Ticket.findAll({
      where: {
        status: `${status}`,
        userId: userIdNumber,
        unreadMessages: {
          [Op.gt]: 0
        }
      }
    });

    // Retorne a lista de tickets encontrados
    return res.status(200).json(tickets);
  } catch (error) {
    console.error("ERROR [getTicketsByStatus]:", error);
    return res
      .status(500)
      .json({ error: "Erro ao buscar notificação de status." });
  }
};
