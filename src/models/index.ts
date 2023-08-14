import { getModelForClass } from '@typegoose/typegoose';
import { Profile } from './profileModel';
import { File } from '../features/file/schema';

// import { Profile } from './models/profileModel';
// import { Level } from './features/level/model';
// import { Department } from './features/department/model';
// import { LeaveType } from './features/leaveType/model';
// import { Position } from './features/position/model';
// import { LeaveRequest } from './features/leaveRequest/model';

export const ProfileModel = getModelForClass(Profile);
export const FileModel = getModelForClass(File);

