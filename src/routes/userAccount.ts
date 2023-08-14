import express from 'express';
import { body, param } from 'express-validator';
import UserCtrl from '../controllers/userController';
import { validateEV } from '../middlewares/validate';
import {
  authenticateUser,
  authenticateAdmin,
  authenticate,
} from '../middlewares/authentication';
import { multerUpload } from '../middlewares/upload';

const router = express.Router();
router.get('/profile', authenticate, UserCtrl.fetchUserProfile);
router.get('/profiles', authenticate, UserCtrl.fetchPublicProfile);

router.post(
  '/contact',
  [
    body('message').notEmpty().withMessage('Message is required'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Email is required'),
  ],
  validateEV,
  UserCtrl.contactUs,
);

router.delete('/profile', authenticateUser, UserCtrl.deleteProfile);
router.put('/profile', authenticateUser, UserCtrl.updateProfile);
router.delete(
  '/:id',
  authenticateAdmin,
  [param('id').isMongoId().withMessage('Invalid id')],
  validateEV,
  UserCtrl.deleteUser,
);

export default router;
