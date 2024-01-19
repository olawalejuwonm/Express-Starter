// Import axios
import axios from 'axios';
import { serviceResponseType } from '../utilities/response';

//get Access Token
export default class LinkedinService {
  static getAccessToken = async (
    code: string,
  ): Promise<serviceResponseType<any>> => {
    try {
      const response = await axios.post(
        `https://www.linkedin.com/oauth/v2/accessToken?grant_type=authorization_code&code=${code}&redirect_uri=${process.env.LINKEDIN_REDIRECT_URI}&client_id=${process.env.LINKEDIN_CLIENT_ID}&client_secret=${process.env.LINKEDIN_CLIENT_SECRET}`,
      );
      return {
        success: true,
        message: 'Access Token fetched successfully',
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error fetching Access Token',
        data: error,
      };
    }
  };

  static getProfile = async (
    accessToken: string,
  ): Promise<serviceResponseType<any>> => {
    try {
      const response = await axios.get(`https://api.linkedin.com/v2/userinfo`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return {
        success: true,
        message: 'Profile fetched successfully',
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error fetching profile',
        data: error,
      };
    }
  };
}
