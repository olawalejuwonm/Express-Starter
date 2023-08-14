import express, { Request, Response } from 'express';
import {
  canCreateUser,
  canDeleteUser,
  canFetchUser,
  canUpdateUser,
} from './guard';
import { validateDTO } from '../../middlewares/validate';
import { CreateUserDto } from './dto';
import UserService from './service';
import response, {
  throwIfError,
  throwPermIfError,
} from '../../utilities/response';
import _ from 'passport-local-mongoose';
const router = express.Router();
const UserPathName = '/User';
/**
 * @openapi
 * 
 * /User:
 *   post:
 *     summary: Create a new User
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
 *     responses:
 *       201:
 *         description: User created successfully
//  *         content:
//  *           application/json:
 */
router.post('/', async (req: Request, res: Response) => {
  throwPermIfError(await canCreateUser(req));
  const body = validateDTO(CreateUserDto, req.body);
  const data = await UserService.create({
    ...body,
    createdBy: req.user._id,
  });
  return response(res, 201, 'User created successfully', data);
});

/**
 * Fetches all Users
 *
 * @openapi
 *
 * /User:
 *   get:
 *     summary: Fetch all Users
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users fetched successfully
 */
router.get('/', async (req: Request, res: Response) => {
  throwPermIfError(await canFetchUser(req));
  const data = await UserService.fetchOne(req.query, {
    _id: req.user._id,
  });
  return response(res, 200, 'Users fetched successfully', data);
});



/**
 * Fetches a single User by ID
 *
 * @openapi
 *
 * /User/{id}:
 *   get:
 *     summary: Fetch a single User by ID
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User fetched successfully
 */
router.get('/', async (req: Request, res: Response) => {
  throwPermIfError(await canFetchUser(req));
  const data = await UserService.fetchOne(req.query, {
    _id: req.user._id,
  });
  return response(res, 200, 'User fetched successfully', data);
});

/**
 * Updates a single User by ID
 * 
 * @openapi
 * 
 * /User/{id}:
 *   put:
 *     summary: Update a single User by ID
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put(
  '/:companyId/:id',
  async (
    req: Request<{
      companyId: string;
      id: string;
    }>,
    res: Response,
  ) => {
    throwPermIfError(await canUpdateUser(req, true));
    const data = await UserService.updateOne({ _id: req.params.id }, req.body);
    return response(res, 200, 'User updated successfully', data);
  },
);

/**
 * Deletes a single User by ID
 * 
 * @openapi
 * 
 * /User/{id}:
 *   delete:
 *     summary: Delete a single User by ID
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
//  *         content:
//  *           application/json:
 */
router.delete('/:id', async (req: Request, res: Response) => {
  throwPermIfError(await canDeleteUser(req));
  const data = await UserService.deleteOne(req.params.id, {
    createdBy: req.user._id,
  });
  return response(res, 200, 'User deleted successfully', data);
});

export default router;
