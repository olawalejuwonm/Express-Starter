import { gmailTransporter } from '../../services/notification';
const Transporter = gmailTransporter;
export const verifyEmailTemplate = async (user: any, token: string) => {
  const html = `
  <div style="background-color: #f5f5f5; padding: 20px;">
      <div style="background-color: #fff; padding: 20px; border-radius: 5px;">
          <div style="text-align: center;">
              <img src="${process.env.APP_LOGO}" alt="Logo" border="0" style="width: 100px; height: 100px;">
          </div>
          <div style="text-align: center;">
              <h1 style="color: #000; font-size: 30px; font-weight: 600;">Welcome to ${process.env.APP_NAME || ""}</h1>
          </div>
          <div style="text-align: center;">
              <p style="color: #000; font-size: 16px; font-weight: 400;">Thank you for registering with us. Please use the following code to verify your email address.</p>
          </div>
          <div style="text-align: center;">
              <h1 style="color: #000; font-size: 30px; font-weight: 600;">${token}</h1>
          </div>
          <div style="text-align: center;">
              <p style="color: #000; font-size: 16px; font-weight: 400;">If you did not register with us, please ignore this email.</p>
          </div>
          <div style="text-align: center;">
              <p style="color: #000; font-size: 16px; font-weight: 400;">Thank you for choosing us.</p>
          </div>
          <div style="text-align: center;">
              <p style="color: #000; font-size: 16px; font-weight: 400;">Regards,</p>
          </div>
          <div style="text-align: center;">
              <p style="color: #000; font-size: 16px; font-weight: 400;">${process.env.APP_NAME || ""} Team</p>
          </div>
      </div>
  </div>
  `;

  return Transporter.sendMail({
    from: `"${process.env.APP_NAME || ""}" <${process.env.MAIL_SENDER}>`,
    to: `${user?.profile?.firstName || user?.profile?.name || ''} ${
      user?.profile?.lastName || ''
    } <${user.email}>`,
    subject: 'Verify your account',
    html,
  });
};

export const resetPasswordTemplate = async (user: any, token: string) => {
  const html = `
  <div style="background-color: #f5f5f5; padding: 20px;">
      <div style="background-color: #fff; padding: 20px; border-radius: 5px;">
          <div style="text-align: center;">
              <img src="${process.env.APP_LOGO}" alt="Logo" border="0" style="width: 100px; height: 100px;">
          </div>
          <div style="text-align: center;">
              <h1 style="color: #000; font-size: 30px; font-weight: 600;">Forgot Password</h1>
          </div>
          <div style="text-align: center;">
              <p style="color: #000; font-size: 16px; font-weight: 400;">You have requested to reset your password. Please use the following code to reset your password.</p>
          </div>
          <div style="text-align: center;">
              <h1 style="color: #000; font-size: 30px; font-weight: 600;">${token}</h1>
          </div>
          <div style="text-align: center;">
              <p style="color: #000; font-size: 16px; font-weight: 400;">If you did not request to reset your password, please ignore this email.</p>
          </div>
          <div style="text-align: center;">
              <p style="color: #000; font-size: 16px; font-weight: 400;">Thank you for choosing us.</p>
          </div>
          <div style="text-align: center;">
              <p style="color: #000; font-size: 16px; font-weight: 400;">Regards,</p>
          </div>
          <div style="text-align: center;">
              <p style="color: #000; font-size: 16px; font-weight: 400;">${process.env.APP_NAME || ""} Team</p>
          </div>
      </div>
  </div>
  `;
  return Transporter.sendMail({
    from: `"${process.env.APP_NAME || ""}" <${process.env.MAIL_SENDER}>`,
    to: `${user?.profile?.firstName || user?.profile?.name || ''} ${
      user?.profile?.lastName || ''
    } <${user.email}>`,
    subject: 'Reset your password',
    html,
  });
};

export const passwordResetConfirmationTemplate = (user: any) => {
  const html = `
  <div style="background-color: #f5f5f5; padding: 20px;">
      <div style="background-color: #fff; padding: 20px; border-radius: 5px;">
          <div style="text-align: center;">
              <img src="${process.env.APP_LOGO}" alt="Logo" border="0" style="width: 100px; height: 100px;">
          </div>
          <div style="text-align: center;">
              <h1 style="color: #000; font-size: 30px; font-weight: 600;">Password Reset Confirmation</h1>
          </div>
          <div style="text-align: center;">
              <p style="color: #000; font-size: 16px; font-weight: 400;">Your password has been successfully reset.</p>
          </div>
          <div style="text-align: center;">
              <p style="color: #000; font-size: 16px; font-weight: 400;">If you did not request to reset your password, please contact us immediately.</p>
          </div>
          <div style="text-align: center;">
              <p style="color: #000; font-size: 16px; font-weight: 400;">Thank you for choosing us.</p>
          </div>
          <div style="text-align: center;">
              <p style="color: #000; font-size: 16px; font-weight: 400;">Regards,</p>
          </div>
          <div style="text-align: center;">
              <p style="color: #000; font-size: 16px; font-weight: 400;">${process.env.APP_NAME || ""} Team</p>
          </div>
      </div>
  </div>
  `;
  return Transporter.sendMail({
    from: `"${process.env.APP_NAME || ""}" <${process.env.MAIL_SENDER}>`,
    to: `${user?.profile?.firstName || user?.profile?.name || ''} ${
      user?.profile?.lastName || ''
    } <${user.email}>`,
    subject: 'Password Reset Confirmation',
    html,
  });
};

export default {
  verifyEmailTemplate,
  resetPasswordTemplate,
  passwordResetConfirmationTemplate,
};
