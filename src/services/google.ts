import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { serviceResponseType } from '../utilities/response';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export default class GoogleService {
  static verifyToken = async (
    token: string,
  ): Promise<serviceResponseType<TokenPayload | undefined>> => {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      return {
        success: true,
        message: 'Token verified successfully',
        data: payload,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error verifying token',
        data: error,
      };
    }
  };

  static getProfile = async (accessToken: string): Promise<boolean> => {
    return true;
  };
}
