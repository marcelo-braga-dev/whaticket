import React from "react";
import { BrowserRouter, Switch } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import LoggedInLayout from "../layout";
import Dashboard from "../pages/Dashboard/";
import Tickets from "../pages/Tickets/";
import Chat from "../pages/Chat/";
import Login from "../pages/Login/";
import Connections from "../pages/Connections/";
import Settings from "../pages/Settings/";
import Users from "../pages/Users";
import Contacts from "../pages/Contacts/";
import QuickAnswers from "../pages/QuickAnswers/";
import Queues from "../pages/Queues/";
import { AuthProvider } from "../context/Auth/AuthContext";
import { WhatsAppsProvider } from "../context/WhatsApp/WhatsAppsContext";
import Route from "./Route";

const Routes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Switch>
          <Route exact path="/login" component={Login} />
          <WhatsAppsProvider>
            <LoggedInLayout>
              <Route exact path="/" component={Tickets} isPrivate />
              <Route exact path="/dashboard" component={Dashboard} isPrivate />
              <Route
                exact
                path="/tickets/:ticketId?"
                component={Tickets}
                isPrivate
              />
              <Route exact path="/chat/:ticketId?" component={Chat} isPrivate />
              <Route
                exact
                path="/connections"
                component={Connections}
                isPrivate
              />
              <Route exact path="/contacts" component={Contacts} isPrivate />
              <Route exact path="/users" component={Users} isPrivate />
              <Route
                exact
                path="/quickAnswers"
                component={QuickAnswers}
                isPrivate
              />
              <Route exact path="/Settings" component={Settings} isPrivate />
              <Route exact path="/Queues" component={Queues} isPrivate />
            </LoggedInLayout>
          </WhatsAppsProvider>
        </Switch>
        <ToastContainer autoClose={3000} />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Routes;
