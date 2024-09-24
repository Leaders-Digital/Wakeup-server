// emailService.js

const nodemailer = require("nodemailer");
dotenv = require("dotenv");
dotenv.config();
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service (e.g., Gmail, SendGrid)
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password or app password
  },
});

const sendOrderEmail = (recipientEmail, orderCode) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipientEmail,
    subject: "Confirmation de votre commande",
    html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKOCxWNxJRIDYjseouGo698Yb96mc0kQAIPg&s" alt="Your Logo" style="width: 150px; height: auto;"/>
          <h2>Merci pour votre commande !</h2>
          <p>Votre code de commande est : <strong>${orderCode}</strong></p>
          <p>Nous vous enverrons un email de confirmation contenant les détails de votre commande.</p>
          <p>Si vous avez des questions ou des préoccupations, n'hésitez pas à nous contacter.</p>
          <p>Merci pour votre confiance et à bientôt sur notre site !</p>
        </div>
      `,
    // attachments: [
    //   {
    //     filename: "logo.png", // Replace with your logo file name
    //     path: "../", // Adjust the path to your logo
    //     cid: "logo", // Referencing the logo in the HTML
    //   },
    // ],
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendOrderEmail };
