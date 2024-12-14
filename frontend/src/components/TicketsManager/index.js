import React, { useContext, useEffect, useRef, useState } from "react";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import SearchIcon from "@material-ui/icons/Search";
import InputBase from "@material-ui/core/InputBase";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Badge from "@material-ui/core/Badge";
import MoveToInboxIcon from "@material-ui/icons/MoveToInbox";
import CheckBoxIcon from "@material-ui/icons/CheckBox";

import NewTicketModal from "../NewTicketModal";
import TicketsList from "../TicketsList";
import TabPanel from "../TabPanel";

import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
// import { Can } from "../Can";
// import TicketsQueueSelect from "../TicketsQueueSelect";

const useStyles = makeStyles((theme) => ({
    ticketsWrapper: {
        position: "relative",
        display: "flex",
        height: "100%",
        flexDirection: "column",
        overflow: "hidden",
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
    },

    tabsHeader: {
        flex: "none",
        backgroundColor: "#eee",
    },

    settingsIcon: {
        alignSelf: "center",
        marginLeft: "auto",
        padding: 8,
    },

    tab: {
        minWidth: 120,
        width: 120,
    },

    ticketOptionsBox: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#fafafa",
        padding: theme.spacing(1),
    },

    serachInputWrapper: {
        flex: 1,
        background: "#fff",
        display: "flex",
        borderRadius: 40,
        padding: 4,
        marginRight: theme.spacing(1),
    },

    searchIcon: {
        color: "grey",
        marginLeft: 6,
        marginRight: 6,
        alignSelf: "center",
    },

    searchInput: {
        flex: 1,
        border: "none",
        borderRadius: 30,
    },

    badge: {
        right: "-10px",
    },
    show: {
        display: "block",
    },
    hide: {
        display: "none !important",
    },
}));

const TicketsManager = () => {
    const classes = useStyles();

    const [searchParam, setSearchParam] = useState("");
    const [tab, setTab] = useState("open");
    const [tabOpen, setTabOpen] = useState("open");
    const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
    const [showAllTickets, setShowAllTickets] = useState(false);
    const searchInputRef = useRef();
    const { user } = useContext(AuthContext);

    const [openCount, setOpenCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);

    const userQueueIds = user?.queues?.map((q) => q.id);
    const [selectedQueueIds, setSelectedQueueIds] = useState(userQueueIds || []);

    const isAdmin = user?.profile?.toUpperCase() === "ADMIN"

    useEffect(() => {
        if (isAdmin) {
            setShowAllTickets(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (tab === "search") {
            searchInputRef.current.focus();
            setSearchParam("");
        }
    }, [tab]);

    let searchTimeout;

    const handleSearch = (e) => {
        const searchedTerm = e.target.value.toLowerCase();

        clearTimeout(searchTimeout);

        if (searchedTerm === "") {
            setSearchParam(searchedTerm);
            setTab("open");
            return;
        }

        searchTimeout = setTimeout(() => {
            setSearchParam(searchedTerm);
        }, 500);
    };

    const handleChangeTab = (e, newValue) => {
        setTab(newValue);
    };

    const handleChangeTabOpen = (e, newValue) => {
        setTabOpen(newValue);
    };

    const applyPanelStyle = (status) => {
        if (tabOpen !== status) {
            return { width: 0, height: 0 };
        }
    };

    return (
        <Paper elevation={0} variant="outlined" className={classes.ticketsWrapper}>
            <NewTicketModal
                modalOpen={newTicketModalOpen}
                onClose={(e) => setNewTicketModalOpen(false)}
            />
            <Paper elevation={0} square className={classes.tabsHeader}>
                <Tabs
                    value={tab}
                    onChange={handleChangeTab}
                    variant="fullWidth"
                    indicatorColor="primary"
                    textColor="primary"
                    aria-label="icon label tabs example"
                >
                    <Tab
                        value={"open"}
                        icon={<MoveToInboxIcon />}
                        label="CHAT"
                        classes={{ root: classes.tab }}
                    />
                    <Tab
                        value={"search"}
                        icon={<SearchIcon />}
                        label={"Pesquisar"}
                        classes={{ root: classes.tab }}
                    />
                    {isAdmin &&
                        <Tab
                            value={"closed"}
                            icon={<CheckBoxIcon />}
                            label={"Finalizados"}
                            classes={{ root: classes.tab }}
                        />}
                </Tabs>
            </Paper>
            {tab === "search" && <Paper square elevation={0} className={classes.ticketOptionsBox}>
                {tab === "search" ? (
                    <div className={classes.serachInputWrapper}>
                        <SearchIcon className={classes.searchIcon} />
                        <InputBase
                            className={classes.searchInput}
                            inputRef={searchInputRef}
                            placeholder={i18n.t("tickets.search.placeholder")}
                            type="search"
                            onChange={handleSearch}
                        />
                    </div>
                ) : (<></>
                    // <Can
                    //     role={user.profile}
                    //     perform="tickets-manager:showall"
                    //     yes={() => (
                    //         <>
                    //             {/* <Button
                    //                 variant="outlined"
                    //                 color="primary"
                    //                 onClick={() => setNewTicketModalOpen(true)}
                    //             >
                    //                 {i18n.t("ticketsManager.buttons.newTicket")}
                    //             </Button> */}
                    //             <FormControlLabel
                    //                 label={i18n.t("tickets.buttons.showAll")}
                    //                 labelPlacement="start"
                    //                 style={{ marginInline: 30 }}
                    //                 control={
                    //                     <Switch
                    //                         size="small"
                    //                         checked={showAllTickets}
                    //                         onChange={() =>
                    //                             setShowAllTickets((prevState) => !prevState)
                    //                         }
                    //                         name="showAllTickets"
                    //                         color="primary"
                    //                     />
                    //                 }
                    //             />
                    //             {/* <TicketsQueueSelect
                    //                 style={{ marginLeft: 6 }}
                    //                 selectedQueueIds={selectedQueueIds}
                    //                 userQueues={user?.queues}
                    //                 onChange={(values) => setSelectedQueueIds(values)}
                    //             /> */}
                    //         </>
                    //     )}
                    // />
                )}

            </Paper>}

            <TabPanel value={tab} name="open" className={classes.ticketsWrapper}>
                <Tabs
                    value={tabOpen}
                    onChange={handleChangeTabOpen}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab
                        label={"Chats"}
                        value={"open"}
                    />
                    {isAdmin && <Tab
                        label={
                            <Badge
                                className={classes.badge}
                                badgeContent={pendingCount}
                                color="secondary"
                            >
                                {i18n.t("ticketsList.pendingHeader")}
                            </Badge>
                        }
                        value={"pending"}
                    />}
                    <Tab
                        label={"GRUPOS"}
                        value={"grups"}
                    />
                </Tabs>
                <Paper className={classes.ticketsWrapper}>
                    <TicketsList
                        status="open"
                        tabOpen={tabOpen}
                        showAll={showAllTickets}
                        selectedQueueIds={selectedQueueIds}
                        updateCount={(val) => setOpenCount(val)}
                        style={applyPanelStyle("open")}
                    />
                    <TicketsList
                        status="open"
                        tabOpen={tabOpen}
                        showAll={showAllTickets}
                        selectedQueueIds={selectedQueueIds}
                        updateCount={(val) => setOpenCount(val)}
                        style={applyPanelStyle("grups")}
                    />
                    <TicketsList
                        status="pending"
                        selectedQueueIds={selectedQueueIds}
                        updateCount={(val) => setPendingCount(val)}
                        style={applyPanelStyle("pending")}
                    />
                </Paper>
            </TabPanel>
            <TabPanel value={tab} name="closed" className={classes.ticketsWrapper}>
                <TicketsList
                    status="closed"
                    showAll={true}
                    selectedQueueIds={selectedQueueIds}
                />
            </TabPanel>
            <TabPanel value={tab} name="search" className={classes.ticketsWrapper}>
                <TicketsList
                    searchParam={searchParam}
                    showAll={true}
                    selectedQueueIds={selectedQueueIds}
                />
            </TabPanel>
        </Paper>
    );
};

export default TicketsManager;