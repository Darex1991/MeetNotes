import { emailTemplateFactory } from "./email-factory";
import WelcomeEmailTemplate from "./templates/WelcomeEmail";
export const WelcomeEmail = emailTemplateFactory(WelcomeEmailTemplate);
import ResetPasswordEmailTemplate from "./templates/ResetPassword";
export const ResetPasswordEmail = emailTemplateFactory(ResetPasswordEmailTemplate);
