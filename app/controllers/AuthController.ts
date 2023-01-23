import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '@models/User';

class AuthController {
  public static register = async (req: Request, res: Response) => {
    const { name, username, email, password, password_confirmation }: {
      name: string, username: string, email: string, password: string, password_confirmation: string
    } = req.body;
    const requestBody = { name, username, email, password, password_confirmation };
    const emptyDataIndex = Object.values(requestBody).findIndex((val) => !val);

    if (emptyDataIndex !== -1) return res.status(400).json({ status: 'Error', message: `field ${Object.keys(requestBody)[emptyDataIndex]} is required!` });
    if (password !== password_confirmation) return res.status(400).json({ status: 'Error', message: 'password doesn\'t match' });

    try {
      let dataAlreadyExistsOnField = null;
      let user = await User.findOne({ where: { username } });

      if (user) {
        dataAlreadyExistsOnField = 'username';
      } else {
        user = await User.findOne({ where: { email } });
        if (user) dataAlreadyExistsOnField = 'email';
      }
      if (dataAlreadyExistsOnField) return res.status(400).json({
        status: 'Error', message: `${dataAlreadyExistsOnField} already used`
      });

      const salt = await bcrypt.genSalt(20);
      const hashedPassword = await bcrypt.hash(password, salt);

      User.create({ name, username, email, password: hashedPassword });
    } catch(e) {
      console.log(e);
      return res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

    return res.status(201).json({ status: 'Ok', message: 'successfully registered new account' });
  };
}

export default AuthController;
