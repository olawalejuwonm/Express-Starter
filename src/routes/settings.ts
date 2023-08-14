import express from 'express';
import {
  fetchSettings,
  updateSettings,
} from '../controllers/settingsController';
import { authenticateAdmin } from '../middlewares/authentication';

const router = express.Router();

router.post(
  '/',
  authenticateAdmin,
  // checkPermission('manage-settings'),
  updateSettings,
);
router.get('/', fetchSettings);

export default router;
