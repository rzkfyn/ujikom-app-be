import 'dotenv/config';
import MailService from './app/services/MailService.js';
import express, { Request, Response } from 'express';

class Test {
  private static mailService = new MailService();

  // public constructor() {
  //   this.mailService = new MailService();
  // }

  public static async test(req: Request, res: Response){
    await Test.mailService.sendMail({
      to: 'rzkfyn@gmail.com',
      subject: 'Email Verification Code',
      text: 'Hi Fyn!\nuse this code to verify your asasas email: 12121'
    });
  }
}

const app = express();

app.get('/', Test.test);

app.listen(8000);