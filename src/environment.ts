import { DocumentType } from '@typegoose/typegoose';
import { User } from './features/user/schema';

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
      user: DocumentType<User>;
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
