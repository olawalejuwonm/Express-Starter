import Token from '../models/token';
import { createRandomNumbers, createHex } from './index';

export const genToken = async (
  user: { _id: any },
  userType: string,
  purpose: string,
) => {
  await Token.updateMany(
    {
      user: user._id,
      type: purpose,
    },
    {
      $set: {
        expired: true,
      },
    },
  );
  const token = await Token.create({
    user: user._id,
    token: createRandomNumbers(5),
    type: purpose,
    userType,
  });
  token.expireAt = new Date(token.createdAt.getTime() + 30 * 60 * 1000);
  token.save();
  console.log('Token created: ', token, 'token');
  return token.token;
};

export const verifyToken = async (
  token: any,
  purpose: string,
): Promise<{
  valid: boolean;
  userId?: any;
  message: string;
}> => {
  const tokenData = await Token.findOne({ token, type: purpose });
  let tokenExpired = false;
  // if (
  //   tokenData &&
  //   tokenData.expireAt &&
  //   Date.now() >= tokenData.expireAt.getTime()
  // ) {
  //   tokenExpired = true;
  // }
  if (!tokenData || tokenData.expired || tokenExpired) {
    return {
      valid: false,
      message: 'This token is invalid or has expired',
    };
  }
  await Token.deleteMany({ user: tokenData.user, type: purpose });
  return { valid: true, userId: tokenData.user, message: 'Token verified' };
};

export default {
  genToken,
  verifyToken,
};
