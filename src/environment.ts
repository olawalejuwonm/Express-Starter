import { DocumentType } from '@typegoose/typegoose';
import { User, UserType } from './models/userModel';
import { Profile } from './models/profileModel';

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
      user: DocumentType<User> & {
        profile: Profile;
      };
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
