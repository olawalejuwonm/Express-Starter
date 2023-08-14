import jwt from 'jsonwebtoken';

export const signJWT = (
  payload: string | object | Buffer,
  secret: jwt.Secret | any,
  expiry: any,
) =>
  jwt.sign(payload, secret, {
    expiresIn: expiry,
  });

interface JwtPayload extends jwt.JwtPayload {
  id?: string;
}

export const decodeJWT: (token: string, secret: jwt.Secret | any) => any = (
  token,
  secret,
) => {
  const decoded = jwt.verify(token, secret);
  return decoded;
};
export default {
  signJWT,
  decodeJWT,
};
