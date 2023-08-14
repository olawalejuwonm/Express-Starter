import express from 'express';
import response from '../utilities/response';
import { validForm } from '../middlewares/validators';
import { Request, Response, NextFunction } from 'express';
import Notification from '../models/notification.model';
import {
  authenticate,
} from '../middlewares/authentication';
import NotificationService from '../appservice/notification.service';


const router = express.Router();

router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    const getNotification = await NotificationService.fetch(req.query, {
      user: req.user._id,
    });
    if (getNotification.success) {
      return response(res, 200, getNotification.message, getNotification.data);
    }
    next(getNotification.data);
  },
);

router.put(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    const thebody = validForm(Notification, req.body, false, {
      ...req.body,
    });
    const updateNotification = await NotificationService.updateOne(
      {
        user: req.user._id,
        _id: req.params.id,
      },
      {
        ...thebody,
      },
    );
    if (updateNotification.success) {
      return response(
        res,
        200,
        updateNotification.message,
        updateNotification.data,
      );
    }
    next(updateNotification.data);
  },
);

router.delete(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    const deleteNotification = await NotificationService.deleteOne({
      user: req.user._id,
      _id: req.params.id,
    });
    if (deleteNotification.success) {
      return response(
        res,
        200,
        deleteNotification.message,
        deleteNotification.data,
      );
    }
    next(deleteNotification.data);
  },
);

export default router;