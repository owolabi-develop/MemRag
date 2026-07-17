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


// register action
import { register_action } from "../auth/component/RegisterForm";

// login action
import { login_action } from "../auth/component/LoginForm";

// Create Tenant Action
import {createTenantAction} from '../tenant/component/Tenant'

//
import { userDashboardLoader } from "../tenant/component/User/UserDashboard";

// document loader
import { documentUploadAction,documentUploadLoader } from "../tenant/component/DocumentUpload";

// connector department loader
import { ConnectorsDepartmentLoader } from "../tenant/component/connectors";

// settings password action
import { setPasswordAction } from "../tenant/component/User/ChangePassword";
export const router = createBrowserRouter([
  {path:"/",Component:App},
  {path:"login",Component:loginPage,action:login_action},
  {path:"register",Component:RegisterPage,action:register_action},
  {path:"forgot-password",Component:ForgotPasswordPage},
  {path:"tenant",Component:Tenant,action:createTenantAction},
   {path:"dashboard",Component:TenantDashboard,
      children:[ {path:"overview",Component:OverviewPage},
        {path:"members",Component:InviteUserPage},
         {path:"departments",Component:DepartmentsPage},
          {path:"documents",Component:DocumentUploadPage,loader:documentUploadLoader,action:documentUploadAction},
           {path:"settings",Component:SettingsPage},
           {path:"connectors",Component:connectorsPage,loader:ConnectorsDepartmentLoader},
      ]
    },
    {path:"chat",Component:Chat},
     {path:"set-initial-password",Component:ChangePassword,action:setPasswordAction},
      {path:"user-dashboard",Component:UserDashboardPage,loader:userDashboardLoader},

]);
