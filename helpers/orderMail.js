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

const sendOwnerEmail = async (orderDetails) => {    
  const mailOptions = {
    from: process.env.EMAIL,
    to: "jesserbenkhiria911@gmail.com", // Store owner's email
    subject: "New Order Created",
    text: `A new order has been created by ${orderDetails.nom} ${orderDetails.prenom}.
             Total price: ${orderDetails.prixTotal}.
             Check your admin panel for more details.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent to the store owner successfully.");
  } catch (error) {
    console.error("Error sending email to the owner:", error);
  }
};

module.exports = { sendOwnerEmail };
