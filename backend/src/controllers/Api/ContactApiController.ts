import { Request, Response } from "express";
import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import User from "../../models/User";

import * as Yup from "yup";
import AppError from "../../errors/AppError";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import Whatsapp from "../../models/Whatsapp";
import CreateOrUpdateContactService from "../../services/ContactServices/CreateOrUpdateContactService";
import FindOrCreateTicketService from "../../services/TicketServices/FindOrCreateTicketService";
import ShowTicketService from "../../services/TicketServices/ShowTicketService";
import CheckIsValidContact from "../../services/WbotServices/CheckIsValidContact";
import CheckContactNumber from "../../services/WbotServices/CheckNumber";
import GetProfilePicUrl from "../../services/WbotServices/GetProfilePicUrl";

interface ContactData {
    number: string;
    name: string;
}

type WhatsappData = {
    whatsappId: number;
};

const createContact = async (
    whatsappId: number | undefined,
    newContact: string,
    name: string | undefined,
) => {
    await CheckIsValidContact(newContact);

    const validNumber: any = await CheckContactNumber(newContact);

    const profilePicUrl = await GetProfilePicUrl(validNumber);

    const number = validNumber;

    const contactData = {
        name: `${name ?? number}`,
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

export const getContacts = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {

        const contacts = await Contact.findAll({
            where: {
                isGroup: false
            },
            include: [
                "extraInfo",
                {
                    model: Ticket,
                    as: "tickets",
                    attributes: ["id", "userId", "status", "lastMessage", "createdAt", "unreadMessages"],
                    include: [
                        {
                            model: User,
                            as: "user",
                            attributes: ["id", "name"],
                        }
                    ],
                }
            ],
        });

        return res.status(200).json(contacts);
    } catch (error) {
        console.error("ERROR [getTicketsByStatus]:", error);
        return res
            .status(500)
            .json({ error: "Erro ao buscar notificação de status." });
    }
};


export const createContactAndTicket = async (
    req: Request,
    res: Response
): Promise<Response> => {

    const newContact: ContactData = req.body;
    const { whatsappId, }: WhatsappData = req.body;
    const { userId } = req.body;

    newContact.number = newContact.number.replace(/\D/g, '');

    const schema = Yup.object().shape({
        number: Yup.string()
            .required()
            .matches(/^\d+$/, "Invalid number format. Only numbers is allowed."),
        name: Yup.string()
    });

    try {
        await schema.validate(newContact);
        const contactAndTicket = await createContact(whatsappId, newContact.number, newContact.name);

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

export const updateUser = async (
    req: Request,
    res: Response
): Promise<Response> => {

    const { userId, contactId } = req.body;

    await Ticket.update(
        { userId: userId },
        { where: { contactId: contactId } }
    );

    try {

        return res.status(201).json({
            message: "Contato atualizado com sucesso!",
        });
    } catch (err: any) {
        if (err instanceof AppError) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        // Erro genérico para situações inesperadas
        console.error("Unexpected error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
