import Datauri from 'datauri/parser';
import path from 'path';

import mainCloudinary from 'cloudinary';
import { FileModel } from '../models';
const cloudinary = mainCloudinary.v2;

const { uploader } = cloudinary;
const dUri = new Datauri();
const dataUri = (file: { originalname: string; buffer: any }) =>
  dUri.format(path.extname(file.originalname).toString(), file.buffer);

const allowFileType: (
  file: { mimetype: string },
  types: string | any[],
) => boolean = (file: { mimetype: string }, types: string | any[]) => {
  const type = types[0];
  const allImageExtensions = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'bmp',
    'tiff',
    'svg',
  ];
  const allVideoExtensions = [
    'mp4',
    'mov',
    'avi',
    'wmv',
    'flv',
    'mpeg',
    'mpg',
    '3gp',
    'mkv',
  ];
  const allAudioExtensions = ['mp3', 'wav', 'aac', 'ogg', 'flac', 'wma', 'm4a'];
  const allDocumentExtensions = [
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'txt',
    'rtf',
    'csv',
  ];
  // const fileMimeType = file.mimetype.split('/')[0]
  const fileExtension = file.mimetype.split('/')[1];
  let res = false;
  if (type === 'image') {
    res = allImageExtensions.includes(fileExtension);
  } else if (type === 'video') {
    res = allVideoExtensions.includes(fileExtension);
  } else if (type === 'audio') {
    res = allAudioExtensions.includes(fileExtension);
  } else if (type === 'document') {
    res = allDocumentExtensions.includes(fileExtension);
  } else {
    // return false;
    res = false;
  }
  if (res === false) {
    if (types?.length > 1) {
      return allowFileType(file, types.slice(1));
    }
  }
  return res;
};

const allowFileSize = (file: { size: number }, size: number) => {
  const fileSize = file.size / 1024 / 1024; // size in MB
  return fileSize <= size;
};

// write documentation
/*
    @param {object} req - request object
    @param {string} type - type of file to upload. default is image
    @param {number} size - size of file to upload. default is 5MB

*/

export const uploadTheFile = async (
  req: Express.Request & {
    /** `Multer.File` object populated by `single()` middleware. */
    file?: Express.Multer.File | undefined;
    /**
     * Array or dictionary of `Multer.File` object populated by `array()`,
     * `fields()`, and `any()` middleware.
     */
    files?: {
      [fieldname: string]: Express.Multer.File[];
    };
    // | Express.Multer.File[]
    // | undefined;
  },
  types = ['image'],
  size = 5,
) => {
  try {
    const promises: any[] = [];
    const filePropeties: any[] = [];
    const contents = [];
    const allFiles: {
      name: any;
      fieldname: any;
      url: any;
      type: any;
      format: any;
      size: any;
      uploadedBy: any;
      encoding: any;
      mimetype: any;
    }[] = [];

    const fileOperation = async (f: any) => {
      if (!allowFileType(f, types)) {
        throw new Error('File type not allowed');

        // return {
        //   success: false,
        //   message: 'File type not allowed',
        // };
      }
      if (!allowFileSize(f, size)) {
        throw new Error(`File size not allowed. Allowed size is ${size}MB`);

        // message of allowed size
        // return {
        //   success: false,
        //   message: `File size not allowed. Allowed size is ${size}MB`,
        // };
      }
      filePropeties.push(f);

      const uri = dataUri(f);

      // -> //fileName: '.png', mimetype: 'image/png', application/pdf and content
      const file: any = uri.content;
      // you can use uri.mimetype to accept files format that you need here

      contents.push(uri.content);

      promises.push(
        uploader.upload(file, {
          resource_type: 'auto',
          folder: process.env.APP_NAME,
        }),
      ); // change this line for other uploads
    };

    // Works for .fields and .array
    if (Object.keys(req.files || {}).length > 0) {
      for (const key in req.files) {
        if (Object.hasOwnProperty.call(req.files, key)) {
          interface FilesObject {
            [fieldname: string]: Express.Multer.File[] | Express.Multer.File;
          }

          if (Array.isArray(req.files[key])) {
            for (let i = 0; i < req.files[key].length; i++) {
              await fileOperation(req.files[key][i]);
            }
          } else {
            await fileOperation(req.files[key]);
          }
        }
      }
    } else if (req.file) {
      const f = req.file;
      await fileOperation(f);
    } else {
      // throw new Error('No file was uploaded')
      return {
        success: false,
        message: 'No file was uploaded',
        noFile: true,
      };
    }

    let files;
    files = [];
    if (promises.length > 0) {
      files = await Promise.all(promises);
    }

    // This returns object with fieldname as key
    const fileObject: any = {};
    // eslint-disable-next-line array-callback-return
    files.map((image, i) => {
      const file = filePropeties[i];
      const objFile = {
        name: file.originalname,
        fieldname: file.fieldname,
        url: image.secure_url,
        type: image.resource_type,
        format: image.format,
        size: file.size,
        uploadedBy: req?.user?._id,
        encoding: file.encoding,
        mimetype: file.mimetype,
      };
      allFiles.push(objFile);
      if (fileObject[file.fieldname]) {
        fileObject[file.fieldname].push(objFile);
      } else {
        fileObject[file.fieldname] = [objFile];
      }
    });
    // req.uploadedFiles = allFiles;
    // next();

    return {
      files: allFiles,
      fileObject,
      success: true,
    };
  } catch (error) {
    console.log('file Upload error', error);
    // throw error;
    return {
      success: false,
      message: error.message,
    };
  }
};
export const saveFiles = async (
  filesToSave: any,
  ref: any,
  refId: any,
  uploader?: any,
) => {
  try {
    let filesId: any;
    let files: any;
    if (Array.isArray(filesToSave)) {
      filesId = [];
      files = [];
      const filesToSavePromises: any[] = [];
      filesToSave.map((file) => {
        filesToSavePromises.push(
          FileModel.create({
            ...file,
            ref: refId,
            refType: ref,
            uploadedBy: uploader,
          }),
        );
      });
      files = await Promise.all(filesToSavePromises);
      files.map((file: { _id: any }) => {
        filesId.push(file._id);
      });
    } else if (typeof filesToSave === 'object') {
      filesId = {};
      files = {};
      for (const key in filesToSave) {
        if (Object.hasOwnProperty.call(filesToSave, key)) {
          const filesToSavePromises: any[] = [];
          if (Array.isArray(filesToSave[key])) {
            filesToSave[key]?.map((file: any) => {
              filesToSavePromises.push(
                FileModel.create({
                  ...file,
                  ref: refId,
                  refType: ref,
                  uploadedBy: uploader,
                }),
              );
            });
          }

          files[key] = await Promise.all(filesToSavePromises);
          filesId[key] = [];
          files[key].map((file: { _id: any }) => {
            filesId[key].push(file._id);
          });
        }
      }
    }

    console.log(
      'micheal ~ file: fileUpload.js ~ line 143 ~ export const saveFiles= ~ files',
      files,
    );

    return { filesId, files };
  } catch (error) {
    throw error;
  }
};

export default {
  uploadTheFile,
  saveFiles,
};
