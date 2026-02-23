import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const mailTransport = nodemailer.createTransport({
  host: process.env.BREVO_HOST,
  port: process.env.BREVO_PORT,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASSWORD,
  },
});

mailTransport.verify((error, success) => {
  if (error) {
    console.log("Mail transport error - " + error);
  } else {
    console.log("Mail transport success -" + success);
  }
});

export const sendBrevoMail = ({ email, subject, body }) => {
  const mailOptions = {
    from: '"LUMEN-RA" <pertuniangubo@gmail.com>',
    to: email,
    subject: subject || `LUMEN-RA.`,
    template: "emailTemplate",
    //   context: body,
    html: body,
  };

  // eslint-disable-next-line no-console
  mailTransport.sendMail(mailOptions, function (error, info) {
    console.log(info);

    if (error) {
      console.log("Mail - ", error);
      return error;
    }

    console.log("Message sent: ", info);
    // mailTransport.close();
    return info;
  });
};
