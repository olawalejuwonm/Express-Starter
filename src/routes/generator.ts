import express from 'express';
import { authenticate } from '../middlewares/authentication';

import DataController from '../controllers/generators/service';
import { multerUpload } from '../middlewares/upload';

const router = express.Router();
router.all('/batch*', DataController.batch);

router.post(
  '/:_type',
  // DataValidator.createSchema,
  // validateEV,  
  multerUpload.any(),
  DataController.create,
);

// router.get('/public', DataController.fetchPublic);

router.get('/single/:model/:id', authenticate, DataController.getSingle);

// // exportToExcel
// router.get(
//   '/exportToExcel/:_type',
//   // authenticate,
//   // DataValidator.fetchManySchema,
//   // validateEV,
//   DataController.exportToExcel,
// );
router.get(
  '/:_type',
  // DataValidator.fetchManySchema, validateEV,
  DataController.fetchMany,
);
router.get(
  '/:_type/:id',
  // DataValidator.fetchOneSchema, validateEV,
  DataController.fetchOne,
);

router.put(
  '/:_type/:id',
  // DataValidator.updateOneSchema,
  // validateEV,
  multerUpload.any(),
  DataController.updateOne,
);

// delete many
// router.delete('/:_type', DataController.deleteMany);
router.delete(
  '/:_type/:id',
  // DataValidator.fetchOneSchema,
  // validateEV,
  DataController.deleteOne,
);


export default router;
