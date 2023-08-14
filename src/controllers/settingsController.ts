import Settings from '../models/settingsModel';
import response from '../utilities/response';
import { Response, Request, NextFunction } from 'express';

export const updateSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = new Settings(req.body);
      await settings.save();
    } else {
      settings = await Settings.findByIdAndUpdate(settings._id, req.body, {
        new: true,
      });
    }
    return response(res, 200, 'Settings updated successfully', settings);
  } catch (error) {
    next(error);
  }
};
export const fetchSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const settings = await Settings.findOne({});
    return response(res, 200, 'Settings fetched successfully', settings);
  } catch (error) {
    next(error);
  }
};


