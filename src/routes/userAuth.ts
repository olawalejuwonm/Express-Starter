import express from 'express';
import pkg, { body, query, param, check } from 'express-validator';
import user from '../controllers/userAuthController';
import { validateDTO, validateEV } from '../middlewares/validate';

import { authenticate, checkUserTypes } from '../middlewares/authentication';

const router = express.Router();

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Email must be a valid email address'),
    body('password')
      .optional({
        checkFalsy: true,
      })
      .isStrongPassword()
      .withMessage(
        'Password must be at least 8 characters long, contain at least one number, one uppercase,one lowercase letter and one special character',
      ),
    body('type').isString().isIn(['employer', 'university']),
  ],
  validateEV,
  // user.registerUser,
);



router.post(
  '/login',
  [
    body('username')
      .isString()
      .withMessage('Please enter a valid username')
      .customSanitizer((value) => value?.toLowerCase()?.trim()),

    body('password').notEmpty().withMessage('Please enter a valid password'),
  ],
  validateEV,
  user.loginUser,
);

router.post(
  '/request-reset-password',
  [
    body('email')
      .customSanitizer((value) => value?.toLowerCase()?.trim())
      .isEmail()
      .withMessage('Email must be a valid email address'),
  ],
  validateEV,
  user.requestResetPassword,
);
router.post(
  '/request-email-verification',
  [
    body('email')
      .customSanitizer((value) => value?.toLowerCase()?.trim())
      .isEmail()
      .withMessage('Email must be a valid email address'),
  ],
  validateEV,
  user.sendVerificationEmail,
);
router.post(
  '/reset-password',
  [
    body('token').exists().withMessage('Token is required'),
    body('newPassword')
      .isStrongPassword()
      .withMessage(
        'New Password must be at least 8 characters long, contain at least one number, one uppercase,one lowercase letter and one special character',
      ),
  ],
  validateEV,
  user.resetPassword,
);

router.post(
  '/verify-email-account',
  [body('token').exists().withMessage('Token is required')],
  validateEV,
  user.verifyAccount,
);

router.post(
  '/change-password',
  authenticate,
  [
    body('oldPassword').isString().withMessage('Old password is required'),
    body('newPassword')
      .isStrongPassword()
      .withMessage('New password must be a strong password'),
  ],
  validateEV,
  user.changePassword,
);

router.get(
  '/linkedin',
  [query('code').isString().withMessage('Code must be a valid string')],
  validateEV,
  user.linkedinLogin,
);

router.post('/google', user.googleLogin);

// router.post('/verify-user', user.verifyUser);

router.post(
  '/verify/individual',
  checkUserTypes(['employer']),
  // user.individualVerification,
);

router.post(
  '/verify/company',
  checkUserTypes(['employer']),
  // user.companyVerification,
);

export default router;
