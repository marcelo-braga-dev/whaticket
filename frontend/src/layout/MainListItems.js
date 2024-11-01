import React, { useContext, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";

import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { Can } from "../components/Can";

function ListItemLink(props) {
  const { icon, primary, to, className } = props;

  const renderLink = React.useMemo(
    () =>
      React.forwardRef((itemProps, ref) => (
        <RouterLink to={to} ref={ref} {...itemProps} />
      )),
    [to]
  );

  return (
    <li>
      <ListItem button component={renderLink} className={className}>
        {icon ? <ListItemIcon>{icon}</ListItemIcon> : null}
        <ListItemText primary={primary} />
      </ListItem>
    </li>
  );
}

const MainListItems = (props) => {
  const { drawerClose } = props;
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user } = useContext(AuthContext);
  const [connectionWarning, setConnectionWarning] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (whatsApps.length > 0) {
        const offlineWhats = whatsApps.filter((whats) => {
          return (
            whats.status === "qrcode" ||
            whats.status === "PAIRING" ||
            whats.status === "DISCONNECTED" ||
            whats.status === "TIMEOUT" ||
            whats.status === "OPENING"
          );
        });
        if (offlineWhats.length > 0) {
          setConnectionWarning(true);
        } else {
          setConnectionWarning(false);
        }
      }
    }, 2000);
    return () => clearTimeout(delayDebounceFn);
  }, [whatsApps]);

  return (
    <div onClick={drawerClose}>
      <Can
        role={user.profile}
        perform="drawer-admin-items:view"
        yes={() => (
          <>
            {/* <ListItemLink
              to="/tickets"
              primary="Conversas"
              icon={<Whatsapp size={22} color="black" />}
            /> */}
            {/* <Divider /> */}
            {/* <ListSubheader inset>
              {i18n.t("mainDrawer.listItems.administration")}
            </ListSubheader> */}
            {/* <ListItemLink
              to="/users"
              primary={i18n.t("mainDrawer.listItems.users")}
              icon={<People size={24} color="black" />}
            /> */}
            {/* <ListItemLink
              to="/dashboard"
              primary="Dashboard"
              icon={<Grid size={24} color="black" />}
            /> */}
            {/* <ListItemLink
              to="/contacts"
              primary={i18n.t("mainDrawer.listItems.contacts")}
              icon={<PersonVcard size={24} color="black" />}
            /> */}
            {/* <ListItemLink
                            to="/quickAnswers"
                            primary={i18n.t("mainDrawer.listItems.quickAnswers")}
                            icon={<ChatText size={24} color="black"/>}
                        /> */}
            {/* <ListItemLink
              to="/connections"
              primary={i18n.t("mainDrawer.listItems.connections")}
              icon={
                <Badge badgeContent={connectionWarning ? "!" : 0} color="error">
                  <Link size={24} color="black" />
                </Badge>
              }
            /> */}
            {/* <ListItemLink
                            to="/queues"
                            primary={i18n.t("mainDrawer.listItems.queues")}
                            icon={<Diagram3 size={24} color="black"/>}
                        /> */}
            {/* <ListItemLink
              to="/settings"
              primary={i18n.t("mainDrawer.listItems.settings")}
              icon={<Gear size={24} color="black" />}
            /> */}
          </>
        )}
      />
    </div>
  );
};

export default MainListItems;
