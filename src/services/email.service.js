require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: process.env.EMAIL_APP_PASSWORD
    ? {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      }
    : {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
      },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend-Ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendRegistrationEmail(userEmail,name){

  const subject= 'Welcome to Backend Ledger'
  const text= `Hello ${name},\n\nThank you for registering at Backend Ledger. \n\n he Backend Ledger Team`;
  const html=`<p> Hello ${name},<p></p>Thank you for registering at Backend Ledger. </p>Best Regards,<br> The BACKEND LEDGER TEAM </p>`

  await sendEmail(userEmail,subject,text,html);
}

async function sendTransactionEmail(userEmail,name,amount,toAccountId,fromAccountId){
  const subject= 'Transaction Notification'
  const text= `Hello ${name},\n\nA transaction has been made on your account. \n\nAmount: ${amount}\n\nTo Account ID: ${toAccountId}\nFrom Account ID: ${fromAccountId}\n\nThank you for using Backend Ledger. \n\nThe Backend Ledger Team`;
  const html=`<p>Hello ${name},</p><p>A transaction has been made on your account.</p><p>Amount: ${amount}</p><p>To Account ID: ${toAccountId}</p><p>From Account ID: ${fromAccountId}</p><p>Thank you for using Backend Ledger.</p><br><p>Best Regards,<br> The BACKEND LEDGER TEAM </p>`

  await sendEmail(userEmail,subject,text,html);
}
async function sendTransactionFailureEmail(userEmail,name,amount,toAccountId,fromAccountId){
  const subject= 'Transaction Failure Notification'
  const text= `Hello ${name},\n\nA transaction has failed on your account. \n\nAmount: ${amount}\n\nTo Account ID: ${toAccountId}\nFrom Account ID: ${fromAccountId}\n\nPlease check your account for more details. \n\nThe Backend Ledger Team`;
  const html=`<p>Hello ${name},</p><p>A transaction has failed on your account.</p><p>Amount: ${amount}</p><p>To Account ID: ${toAccountId}</p><p>From Account ID: ${fromAccountId}</p><p>Please check your account for more details.</p><br><p>Best Regards,<br> The BACKEND LEDGER TEAM </p>`
  await sendEmail(userEmail,subject,text,html);
}
module.exports = {sendRegistrationEmail, sendTransactionEmail, sendTransactionFailureEmail};
