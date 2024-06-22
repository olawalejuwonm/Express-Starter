import express, { Request, Response } from 'express';
import { authPaths } from './guard';
import AuthService from './service';
import response, { throwIfError } from '../../utilities/response';
import { validateDTO } from '../../middlewares/validate';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginAdminDto,
  LoginDto,
  ResetPasswordDto,
  VerifyEmailResendDto,
  VerifyToken,
} from './dto';
import {
  authenticate,
  authenticateAdmin,
} from '../../middlewares/authentication';
import { tokenValid } from '../../utilities/token';
const router = express.Router();

router.post(authPaths.login, async (req: Request, res: Response) => {
  const body: LoginDto = validateDTO(LoginDto, req.body);
  const data = throwIfError(await AuthService.login(body));
  return response(res, data.statusCode, data.message, data.data);
});

router.post(
  authPaths.changePassword,
  authenticate,
  async (req: Request, res: Response) => {
    const body = validateDTO(ChangePasswordDto, req.body);
    const data = throwIfError(await AuthService.changePassword(body, req.user));
    return response(res, data.statusCode, data.message, data.data);
  },
);

router.post(
  authPaths.verifyEmailAccount,
  async (req: Request, res: Response) => {
    const body = validateDTO(VerifyToken, req.body);
    const data = throwIfError(await AuthService.verifyEmailAccount(body));
    return response(res, 201, data.message, data.data);
  },
);

router.post(
  authPaths.requestEmailVerification,
  async (req: Request, res: Response) => {
    const body = validateDTO(VerifyEmailResendDto, req.body);
    const data = throwIfError(await AuthService.sendVerificationEmail(body));
    return response(res, 201, data.message, data.data);
  },
);

router.post(
  authPaths.requestPhoneVerification,
  async (req: Request, res: Response) => {
    const data = throwIfError(
      await AuthService.sendPhoneVerification(req.body),
    );
    return response(res, 201, data.message, data.data);
  },
);

router.post(authPaths.verifyPhone, async (req: Request, res: Response) => {
  const body = validateDTO(VerifyToken, req.body);
  const token = body.token;
  const data = throwIfError(await AuthService.verifyPhone(token));
  return response(res, 201, data.message, data.data);
});

router.post(
  authPaths.requestResetPassword,
  async (req: Request, res: Response) => {
    const body = validateDTO(ForgotPasswordDto, req.body);
    const data = throwIfError(await AuthService.requestResetPassword(body));
    return response(res, 201, data.message, data.data);
  },
);

router.post(authPaths.resetPassword, async (req: Request, res: Response) => {
  const body = validateDTO(ResetPasswordDto, req.body);
  const data = throwIfError(await AuthService.resetPassword(body));
  return response(res, 201, data.message, data.data);
});

router.get(authPaths.tokenValidity, async (req: Request, res: Response) => {
  const query = validateDTO(VerifyToken, req.query);
  const data = throwIfError(await tokenValid(query.token));
  return response(res, data.statusCode, data.message, data.data);
});

router.post(
  '/login-admin',
  authenticateAdmin,
  async (req: Request, res: Response) => {
    const body = validateDTO(LoginAdminDto, req.body);
    const data = throwIfError(await AuthService.loginAdmin(body));
    return response(res, data.statusCode, data.message, data.data);
  },
);
export default router;
