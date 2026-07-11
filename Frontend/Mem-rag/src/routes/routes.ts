import App from "../App";
import { createBrowserRouter } from "react-router";
import loginPage from "../auth/pages/loginPage";
import RegisterPage from "../auth/pages/RegisterPage";
import ForgotPasswordPage from "../auth/pages/ForgotPasswordPage";
import Tenant from "../tenant/page/Tenant";
import TenantDashboard from "../tenant/component/Dashboard";
import OverviewPage from "../tenant/page/OverviewPage";
import InviteUserPage from "../tenant/page/InviteUserPage";
import DepartmentsPage from "../tenant/page/DepartmentsPage";
import DocumentUploadPage from "../tenant/page/DocumentUploadPage";
import SettingsPage from "../tenant/page/SettingsPage";
import connectorsPage from "../tenant/page/connectorsPage";
import Chat from "../chatsession/page/Chat";
import ChangePassword from "../tenant/page/User/ChangePassword";
import UserDashboardPage from "../tenant/page/User/UserDashboardPage";


export const router = createBrowserRouter([
  {path:"/",Component:App},
  {path:"login",Component:loginPage},
  {path:"register",Component:RegisterPage},
  {path:"forgot-password",Component:ForgotPasswordPage},
  {path:"tenant",Component:Tenant},
   {path:"dashboard",Component:TenantDashboard,
      children:[ {path:"overview",Component:OverviewPage},
        {path:"members",Component:InviteUserPage},
         {path:"departments",Component:DepartmentsPage},
          {path:"documents",Component:DocumentUploadPage},
           {path:"settings",Component:SettingsPage},
           {path:"connectors",Component:connectorsPage},
      ]
    },
    {path:"chat",Component:Chat},
     {path:"change-initial-password",Component:ChangePassword},
      {path:"user-dashboard",Component:UserDashboardPage},

]);
