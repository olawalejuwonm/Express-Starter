import express, { Request, Response } from 'express';
import {
  canCreateFile,
  canDeleteFile,
  canFetchFile,
  canUpdateFile,
} from './guard';
import FileService from './service';
import response, {
  throwIfError,
  throwPermIfError,
} from '../../utilities/response';
import _ from 'passport-local-mongoose';
import { saveFiles, uploadTheFile } from '../../services/fileUpload';
import { authenticate } from '../../middlewares/authentication';
import { multerUpload } from '../../middlewares/upload';
const router = express.Router();
const FilePathName = '/File';
/**
 * @openapi
 * 
 * /File:
 *   post:
 *     summary: Create a new File
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
 *     responses:
 *       201:
 *         description: File created successfully
//  *         content:
//  *           application/json:
 */
router.post(
  '/',
  authenticate,
  multerUpload.any(),
  async (req: any, res: Response) => {
    // throwPermIfError(await canCreateFile(req, true));
    // const content = throwIfError(
    //   await FileService.create(req.body, { createdBy: req.user._id }),
    // );
    // return response(res, content.statusCode, content.message, content.data);

    const { ref, refType } = req.body;
    const fileUploaded = await uploadTheFile(req, ['image', 'document']);
    if (!fileUploaded.success) {
      return response(res, 400, fileUploaded.message);
    }
    const file = await saveFiles(fileUploaded, refType, ref, req.user._id);
    return response(res, 200, 'File uploaded successfully', file);
  },
);

/**
 * Fetches all Files
 *
 * @openapi
 *
 * /File:
 *   get:
 *     summary: Fetch all Files
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Files fetched successfully
 */
router.get('/', async (req: Request, res: Response) => {
  const perm = throwPermIfError(await canFetchFile(req, false));
  const content = throwIfError(
    await FileService.fetch(req.query, {
      // TODO: Add validations later
      // createdBy: req.user._id,
      // ...perm.query,
    }),
  );
  return response(res, content.statusCode, content.message, content.data);
});

/**
 * Fetches a single File by ID
 *
 * @openapi
 *
 * /File/{id}:
 *   get:
 *     summary: Fetch a single File by ID
 *     tags:
 *       - Files
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
 *         description: File fetched successfully
 */
router.get('/:id', async (req: Request, res: Response) => {
  const perm = throwPermIfError(await canFetchFile(req, false));
  const content = throwIfError(
    await FileService.fetchOne(req.query, {
      _id: req.params.id,
      createdBy: req.user._id,
      ...perm.query,
    }),
  );
  return response(res, content.statusCode, content.message, content.data);
});

/**
 * Updates a single File by ID
 * 
 * @openapi
 * 
 * /File/{id}:
 *   put:
 *     summary: Update a single File by ID
 *     tags:
 *       - Files
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
 *         description: File updated successfully
 */
router.put('/:id', async (req: Request, res: Response) => {
  const perm = throwPermIfError(await canUpdateFile(req, false));
  const content = throwIfError(
    await FileService.updateOne(
      { _id: req.params.id, ...perm.query },
      req.body,
    ),
  );
  return response(res, content.statusCode, content.message, content.data);
});

/**
 * Deletes a single File by ID
 * 
 * @openapi
 * 
 * /File/{id}:
 *   delete:
 *     summary: Delete a single File by ID
 *     tags:
 *       - Files
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
 *         description: File deleted successfully
//  *         content:
//  *           application/json:
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const perm = throwPermIfError(await canDeleteFile(req, false));
  const content = throwIfError(
    await FileService.deleteOne(req.params.id, {
      createdBy: req.user._id,
      ...perm.query,
    }),
  );
  return response(res, content.statusCode, content.message, content.data);
});

export default router;
