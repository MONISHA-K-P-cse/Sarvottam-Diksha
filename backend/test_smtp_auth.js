import nodemailer from 'nodemailer';

const pass = 'xiumftylpfovrmek';
const emailsToTest = [
  'sarvottamdiksha@gmail.com',
  'dikshasarvottam@gmail.com',
  'sarvottam.diksha@gmail.com',
  'sarvottamdiksha.portal@gmail.com',
  'sarvottamdiksha.support@gmail.com'
];

async function findWorkingEmail() {
  for (const user of emailsToTest) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user, pass }
      });
      await transporter.verify();
      console.log(`✅ SUCCESS! Authenticated with user: ${user}`);
      return user;
    } catch (err) {
      console.log(`❌ Failed for ${user}: ${err.message}`);
    }
  }
}

findWorkingEmail();
