import { DocumentType } from '@typegoose/typegoose';
import UserModel, { UserType } from './models/userModel';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      MONGODB_URI: string;
      jwtKey: string;
      email: string;
      password: string;
      sessionSecret: string;
    }
  }

  namespace Express {
    interface Request {
      user: UserType;
    }
  }

  namespace App {
    interface Trier {
      success: boolean;
      message: string;
      data: object;
    }
  }
}

export default {};
