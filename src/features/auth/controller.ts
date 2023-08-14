import express, { Request, Response } from 'express';
import {
  canCreateAuth,
  canDeleteAuth,
  canFetchAuth,
  canUpdateAuth,
} from './guard';
import AuthService from './service';
import _ from 'passport-local-mongoose';
import response, { throwIfError } from '../../utilities/response';
import { validateDTO } from '../../middlewares/validate';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
  VerifyEmailResendDto,
} from './dto';
import { authenticate } from '../../middlewares/authentication';
const router = express.Router();
const AuthPathName = '/Auth';
/**
 * @openapi
 * 
 * /Auth:
 *   post:
 *     summary: Create a new Auth
 *     tags:
 *       - Auths
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
 *     responses:
 *       201:
 *         description: Auth created successfully
//  *         content:
//  *           application/json:
 */
router.post('/login', async (req: Request, res: Response) => {
  const body = validateDTO(LoginDto, req.body);
  const data = throwIfError(await AuthService.login(body));
  return response(res, data.statusCode, data.message, data.data);
});

/**
 *change-password
 verify-email-account
 /reset-password
 /request-email-verification
 /request-reset-password
 *
 */
router.post('/register', async (req: Request, res: Response) => {
  const body = validateDTO(RegisterDto, req.body);
  const data = throwIfError(await AuthService.register(body));
  return response(res, data.statusCode, data.message, data.data);
});

router.post(
  '/change-password',
  authenticate,
  async (req: Request, res: Response) => {
    const body = validateDTO(ChangePasswordDto, req.body);
    const data = throwIfError(await AuthService.changePassword(body, req.user));
    return response(res, data.statusCode, data.message, data.data);
  },
);

router.post('/verify-email-account', async (req: Request, res: Response) => {
  const body = validateDTO(VerifyEmailDto, req.body);
  const data = throwIfError(await AuthService.verifyEmailAccount(body));
  return response(res, 201, data.message, data.data);
});

router.post(
  '/request-email-verification',
  async (req: Request, res: Response) => {
    const body = validateDTO(VerifyEmailResendDto, req.body);
    const data = throwIfError(await AuthService.sendVerificationEmail(body));
    return response(res, 201, data.message, data.data);
  },
);

router.post('/request-reset-password', async (req: Request, res: Response) => {
  const body = validateDTO(ForgotPasswordDto, req.body);
  const data = throwIfError(await AuthService.requestResetPassword(body));
  return response(res, 201, data.message, data.data);
});

router.post('/reset-password', async (req: Request, res: Response) => {
  const body = validateDTO(ResetPasswordDto, req.body);
  const data = throwIfError(await AuthService.resetPassword(body));
  return response(res, 201, data.message, data.data);
});
export default router;
