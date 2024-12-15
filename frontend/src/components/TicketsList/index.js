import React, { useState, useEffect, useReducer, useContext, useMemo } from "react";
import openSocket from "../../services/socket-io";

import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import Paper from "@material-ui/core/Paper";

import TicketListItem from "../TicketListItem";
import TicketsListSkeleton from "../TicketsListSkeleton";

import useTickets from "../../hooks/useTickets";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";

import { Stack } from "@mui/material";
import Badge from "@material-ui/core/Badge";
import { green } from "@material-ui/core/colors";
import Chip from '@mui/material/Chip';

const useStyles = makeStyles((theme) => ({
    ticketsListWrapper: {
        position: "relative",
        display: "flex",
        height: "100%",
        flexDirection: "column",
        overflow: "hidden",
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
    },
    ticketsList: {
        flex: 1,
        overflowY: "scroll",
        ...theme.scrollbarStyles,
        borderTop: "2px solid rgba(0, 0, 0, 0.12)",
    },
    noTicketsText: {
        textAlign: "center",
        color: "rgb(104, 121, 146)",
        fontSize: "14px",
        lineHeight: "1.4",
    },
    noTicketsTitle: {
        textAlign: "center",
        fontSize: "16px",
        fontWeight: "600",
        margin: "0px",
    },
    noTicketsDiv: {
        display: "flex",
        height: "100px",
        margin: 40,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
    },
    newMessagesCount: {
        alignSelf: "center",
        marginRight: 8,
    },
    badgeStyle: {
        color: "white",
        backgroundColor: green[500],
    },
}));

// Correção do reducer para garantir imutabilidade
const reducer = (state, action) => {
    switch (action.type) {
        case "LOAD_TICKETS":
            const newTickets = action.payload;
            const updatedState = [...state];
            newTickets.forEach((ticket) => {
                const ticketIndex = updatedState.findIndex((t) => t.id === ticket.id);
                if (ticketIndex !== -1) {
                    updatedState[ticketIndex] = ticket;
                    if (ticket.unreadMessages > 0) {
                        updatedState.unshift(updatedState.splice(ticketIndex, 1)[0]);
                    }
                } else {
                    updatedState.push(ticket);
                }
            });
            return updatedState;

        case "RESET_UNREAD":
            return state.map((t) =>
                t.id === action.payload ? { ...t, unreadMessages: 0 } : t
            );

        case "UPDATE_TICKET":
            return state.map((t) =>
                t.id === action.payload.id ? { ...action.payload } : t
            );

        case "UPDATE_TICKET_UNREAD_MESSAGES":
            return [
                { ...action.payload },
                ...state.filter((t) => t.id !== action.payload.id),
            ];

        case "UPDATE_TICKET_CONTACT":
            return state.map((t) =>
                t.contactId === action.payload.id ? { ...t, contact: action.payload } : t
            );

        case "DELETE_TICKET":
            return state.filter((t) => t.id !== action.payload);

        case "RESET":
            return [];

        default:
            return state;
    }
};

const TicketsList = (props) => {
    const { status, searchParam, showAll, selectedQueueIds, updateCount, style, tabOpen } =
        props;
    const classes = useStyles();
    const [pageNumber, setPageNumber] = useState(1);
    const [naoLidas, setNaoLidas] = useState(false);
    const [ticketsList, dispatch] = useReducer(reducer, []);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        dispatch({ type: "RESET" });
        setPageNumber(1);
    }, [status, searchParam, showAll, selectedQueueIds]);

    const { tickets, hasMore, loading } = useTickets({
        pageNumber,
        searchParam,
        status,
        showAll,
        queueIds: JSON.stringify(selectedQueueIds),
    });

    useEffect(() => {
        if (!status && !searchParam) return;
        dispatch({
            type: "LOAD_TICKETS",
            payload: tickets,
        });
    }, [searchParam, status, tickets]);

    useEffect(() => {
        const socket = openSocket();

        const shouldUpdateTicket = (ticket) =>
            !searchParam &&
            (!ticket.userId || ticket.userId === user?.id || showAll) &&
            (!ticket.queueId || selectedQueueIds.indexOf(ticket.queueId) > -1);

        const notBelongsToUserQueues = (ticket) =>
            ticket.queueId && selectedQueueIds.indexOf(ticket.queueId) === -1;

        socket.on("connect", () => {
            if (status) {
                socket.emit("joinTickets", status);
            } else {
                socket.emit("joinNotification");
            }
        });

        socket.on("ticket", (data) => {
            if (data.action === "updateUnread") {
                dispatch({
                    type: "RESET_UNREAD",
                    payload: data.ticketId,
                });
            }

            if (data.action === "update" && shouldUpdateTicket(data.ticket)) {
                dispatch({
                    type: "UPDATE_TICKET",
                    payload: data.ticket,
                });
            }

            if (data.action === "update" && notBelongsToUserQueues(data.ticket)) {
                dispatch({ type: "DELETE_TICKET", payload: data.ticket.id });
            }

            if (data.action === "delete") {
                dispatch({ type: "DELETE_TICKET", payload: data.ticketId });
            }
        });

        socket.on("appMessage", (data) => {
            if (data.action === "create" && shouldUpdateTicket(data.ticket)) {
                dispatch({
                    type: "UPDATE_TICKET_UNREAD_MESSAGES",
                    payload: data.ticket,
                });
            }
        });

        socket.on("contact", (data) => {
            if (data.action === "update") {
                dispatch({
                    type: "UPDATE_TICKET_CONTACT",
                    payload: data.contact,
                });
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [status, searchParam, showAll, user, selectedQueueIds]);

    useEffect(() => {
        if (typeof updateCount === "function") {
            updateCount(ticketsList.length);
        }
    }, [ticketsList, updateCount]);

    const loadMore = () => {
        setPageNumber((prevState) => prevState + 1);
    };

    const handleScroll = (e) => {
        if (!hasMore || loading) return;

        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

        if (scrollHeight - (scrollTop + 100) < clientHeight) {
            e.currentTarget.scrollTop = scrollTop - 100;
            loadMore();
        }
    };

    const handleMensages = () => {
        setNaoLidas((e) => !e);
    };

    // Usando useMemo para otimizar o cálculo de tickets filtrados
    const ticketsFiltered = useMemo(() => {
        return ticketsList
            .filter((ticket) => (user.profile === "user" ? ticket.userId === user.id : true))
            .filter((ticket) => {
                if (status === "pending") {
                    return true;
                }
                if (tabOpen === "grups") {
                    return ticket.isGroup;
                } else {
                    return !ticket.isGroup;
                }
            })
            .filter((ticket) => (naoLidas ? ticket.unreadMessages > 0 : true));
    }, [ticketsList, user, naoLidas, tabOpen, status]);

    const countUnread = ticketsFiltered.filter(
        (ticket) => ticket.unreadMessages > 0
    ).length

    return (
        <Paper className={classes.ticketsListWrapper} style={style}>
            <Paper
                square
                name="closed"
                elevation={0}
                className={classes.ticketsList}
                onScroll={handleScroll}
            >
                <Stack margin={2} direction="row" justifyContent="flex-end">
                    <Badge
                        className={classes.newMessagesCount}
                        badgeContent={countUnread}
                        classes={{ badge: classes.badgeStyle }}
                    >
                        <Chip
                            label="Não Lidas"
                            color="success"
                            size="small"
                            variant={naoLidas ? 'filled' : 'outlined'}
                            onClick={handleMensages}
                            style={{ cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                        />
                    </Badge>
                </Stack>

                <List style={{ paddingTop: 0 }}>
                    {ticketsFiltered.length === 0 && !loading ? (
                        <div className={classes.noTicketsDiv}>
                            <span className={classes.noTicketsTitle}>
                                {i18n.t("ticketsList.noTicketsTitle")}
                            </span>
                            <p className={classes.noTicketsText}>
                                {i18n.t("ticketsList.noTicketsMessage")}
                            </p>
                        </div>
                    ) : (
                        ticketsFiltered.map((ticket) => (
                            <TicketListItem ticket={ticket} key={ticket.id} />
                        ))
                    )}
                    {loading && <TicketsListSkeleton />}
                </List>
            </Paper>
        </Paper>
    );
};

export default TicketsList;
