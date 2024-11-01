import { Request, Response } from "express";
import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import User from "../../models/User";

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
