import express, { Request, Response } from 'express';
import {
  canDeleteUser,
  canFetchProfile,
  canFetchProfiles,
  canUpdateUserStatus,
} from './guard';
import { validateDTO } from '../../middlewares/validate';
import { UpdateUserDto, UpdateUserStatusDto } from './dto';
import UserService from './service';
import response, {
  throwIfError,
  throwPermIfError,
} from '../../utilities/response';
import _ from 'passport-local-mongoose';
import mongoose from 'mongoose';
import { checkUserTypes } from '../../middlewares/authentication';
const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  const perm = throwPermIfError(await canFetchProfile(req));
  const data = throwIfError(
    await UserService.fetchUsers(req.query, {
      ...perm.query,
    }),
  );
  return response(res, data.statusCode, data.message, data.data);
});

router.put(
  '/',
  async (
    req: Request<{
      id: string;
    }>,
    res: Response,
  ) => {
    const perm = throwPermIfError(await canFetchProfile(req));
    const payload = validateDTO(UpdateUserDto, req.body);
    const data = throwIfError(
      await UserService.updateOne({ ...perm.query }, payload),
    );

    return response(res, data.statusCode, data.message, data.data);
  },
);

router.put(
  '/update-status',
  async (
    req: Request<{
      id: string;
    }>,
    res: Response,
  ) => {
    const perm = throwPermIfError(await canUpdateUserStatus(req, true));
    const body = validateDTO(UpdateUserStatusDto, req.body);
    const data = throwIfError(
      await UserService.updateStatus({ ...perm.query, _id: body.id }, req.body),
    );

    return response(res, data.statusCode, data.message, data.data);
  },
);

router.delete('/:id', async (req: Request, res: Response) => {
  throwPermIfError(await canDeleteUser(req));
  const data = throwIfError(
    await UserService.deleteOne(req.params.id, {
      createdBy: req.user._id,
    }),
  );
  return response(res, data.statusCode, data.message, data.data);
});

// an endpoint that delete all collection in the database
if (process.env.NODE_ENV !== 'production') {
  router.delete(
    '/all/data',
    checkUserTypes(['super']),
    async (req: Request, res: Response) => {
      // get all collection from mongoose
      const collections = mongoose.connection.collections;
      // loop through the collections
      for (const key in collections) {
        // delete the collection
        await collections[key].deleteMany({});
      }

      return response(res, 200, 'All collections deleted', {});
    },
  );
}

export default router;
