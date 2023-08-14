import multer from 'multer';
import pkg from 'cloudinary';

import response from '../utilities/response';
import { Response } from 'express';
const cloudinary = pkg.v2;
const { config, uploader } = cloudinary;
config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = multer.memoryStorage();
export const multerUpload = multer({
  storage,
});

export const uploadHandler = (
  req: {
    upload: (
      arg0: any,
      arg1: any,
      arg2: (
        err: any,
      ) =>
        | Response<any, Record<string, any>>
        | { status: number; message: any; data: any }
        | undefined,
    ) => void;
    body: { files: any };
    files: any;
  },
  res: Response<any, Record<string, any>>,
  next: () => void,
) => {
  
  req.upload(req, res, (err: { message: any }) => {
    if (err) {
      // res
      //   .status(400)
      //   .json({
      //     error: `Bad request upload handler, ${err.message}`,
      //     success: false,
      //     message: "Bad request",
      //   })
      //   .end();
      return response(res, 400, 'Bad request', err.message);
    }
    // special workaround for files validating with express-validator
    // if req.files is an object
    req.body.files = req.files;
    
    

    next();
  });
};

export default {
  multerUpload,
  uploadHandler,
};
