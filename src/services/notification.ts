import nodemailer from 'nodemailer';

export const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_SENDER,
    pass: process.env.MAIL_PASSWORD,
  },
});

// export const zohoTransporter = nodemailer.createTransport({
//   host: 'smtp.zoho.com',
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.MAIL_SENDER,
//     pass: process.env.MAIL_PASSWORD,
//   },
// });

export default {
  gmailTransporter,
  // zohoTransporter,
};
