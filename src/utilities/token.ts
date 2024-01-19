import { UserType } from '../features/user/schema';
import { TokenModel } from '../models';
import { Token, TokenType } from '../models/token';
import { createRandomNumbers, createHex } from './index';
import { serviceError, serviceResponseType, serviceSuccess } from './response';
import { FindOneReturnType } from './templates/types';

export const genToken = async (
  user: UserType,
  userType: string,
  purpose: string,
) => {
  await TokenModel.updateMany(
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
  const token = await TokenModel.create({
    user: user._id,
    token: createRandomNumbers(4),
    type: purpose,
    userType,
  });
  token.expireAt = new Date(token?.createdAt?.getTime() + 30 * 60 * 1000);
  token.save();
  console.log('Token created: ', token, 'token');
  return token.token;
};

export const saveToken = async (
  tokenLength: number,
  payload: string,
  purpose: TokenType,
  userType: string = 'User',
) => {
  await TokenModel.updateMany(
    {
      payload,
      type: purpose,
      userType,
    },
    {
      $set: {
        expired: true,
      },
    },
  );
  const token = await TokenModel.create({
    token: createRandomNumbers(tokenLength),
    type: purpose,
    payload,
    userType,
  });
  token.expireAt = new Date(token.createdAt.getTime() + 30 * 60 * 1000);
  token.save();
  console.log('Token created: ', token, 'token');
  return token.token;
};

export const verifyToken = async (
  token: any,
  purpose: TokenType,
): Promise<{
  valid: boolean;
  userId?: any;
  message: string;
  token?: Token;
}> => {
  const tokenData = await TokenModel.findOne({ token, type: purpose });
  let tokenExpired = false;
  if (!tokenData || tokenData.expired || tokenExpired) {
    return {
      valid: false,
      message: 'This token is invalid or has expired',
    };
  }
  await TokenModel.deleteMany({ user: tokenData.user, type: purpose });
  console.log('Token verified: ', tokenData, 'token');
  return {
    token: tokenData,
    valid: true,
    userId: tokenData.user,
    message: 'Token verified',
  };
};

export const tokenValid = async (
  token: string,
): Promise<serviceResponseType<FindOneReturnType<Token>>> => {
  try {
    const tokenData = await TokenModel.findOne({ token });
    if (!tokenData || tokenData.expired) {
      throw new Error('Invalid Token');
    }
    // token expires in 10 minutes
    if (tokenData?.createdAt?.getTime() + 10 * 60 * 1000 <= Date.now()) {
      throw new Error('Invalid Token');
    }
    return serviceSuccess(tokenData, 'Token Valid');
  } catch (error) {
    return serviceError(error);
  }
};

export default {
  genToken,
  verifyToken,
};
