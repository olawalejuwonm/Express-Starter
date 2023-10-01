import { UserType } from '../../models/userModel';
import Settings from '../../models/settingsModel';
import connectDb from '../connectDb';
import Permission from '../../models/permissionModel';
import Role from '../../models/role.model';
import { importAllModels } from '../../controllers/generators/service';
import { crudModelPermssions } from '../../guards';
import { Types } from 'mongoose';
import _ from 'lodash';
import { ProfileModel, UserModel } from '../../models';

const payload = {
  firstName: 'Super',
  lastName: 'Admin',
  email: `admin@${process.env.APP_NAME || ''}.com`,
  password: 'Super@1234',
  phone: '123456677',
  emailVerified: true,
  isAdmin: true,
  status: 'active',
  type: 'super',
};

//TODO: Create  company account

const superAdminPermissions: string[] = ['assign:role'];

const universityPermissions: string | string[] = [];

const companyPermissions: string | string[] = [];
const roles = {
  'university-admin': [...crudModelPermssions(universityPermissions)],
  'company-admin': [...crudModelPermssions(companyPermissions)],
  'university-staff': [...crudModelPermssions(universityPermissions, 'r')],
  'company-staff': [...crudModelPermssions(companyPermissions, 'r')],
};

// console.log('roles', roles);
const seed = async (): Promise<void> => {
  try {
    // const service = Promise.all([DojahService.subscribeToService()]);
    // service.then((res) => {
    //   console.log('res', res);
    // });

    const allModels = await importAllModels();
    Object.keys(allModels).forEach((model: string) => {
      const permissionsM = crudModelPermssions(model);
      superAdminPermissions.push(...permissionsM);
    });
    await connectDb();
    let admin = await UserModel.findOne({
      email: payload.email?.toLocaleLowerCase(),
    });

    if (!admin) {
      // Create Profile
      const profile = await ProfileModel.create(payload);
      admin = await UserModel.register(
        new UserModel({ ...payload, profile: profile._id }),
        payload.password,
      );
      profile.createdBy = admin._id;
      await profile.save();
      console.log('admin seeded successfully', admin);
    }

    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({
        superAdmin: admin._id,
      });
      console.log('settings seeded successfully', settings);
    }

    let permissions: Types.ObjectId[] = [];
    superAdminPermissions.forEach(async (permission, i, a) => {
      try {
        let thisPermission = await Permission.findOne({ name: permission });
        if (!thisPermission) {
          thisPermission = await Permission.create({
            name: permission,
          });
        }
        permissions.push(thisPermission._id);
      } catch (error) {
        console.log(error);
      } finally {
        try {
          if (i === a.length - 1) {
            console.log('permission seeded');
            let role = await Role.findOne({ slug: 'super-admin' });
            if (!role) {
              role = await Role.create({
                name: 'Super Admin',
                description: 'Super Admin',
                status: 'active',
                type: 'default',
              });
            }
            role.permissions = permissions;
            await role.save();
            if (!(admin?.roles || [])?.includes(role._id) && admin?.roles) {
              admin?.roles.push(role._id);
            }
            await admin?.save();
            console.log('role seeded and permission added');
          }
        } catch (error) {
          console.log(error);
        }
      }
    });
    // Iterate roles object
    for (let [roleName, rolePermissions] of Object.entries(roles)) {
      let role = await Role.findOne({
        name: roleName,
      });
      if (!role) {
        role = await Role.create({
          name: roleName,
          type: 'default',
        });
      }
      const rolePermissionsExists = await Permission.find({
        name: {
          $in: rolePermissions,
        },
      }).select('_id');
      const rolePermissionsIds = rolePermissionsExists.map(
        (permission) => permission._id,
      );
      role.permissions = rolePermissionsIds;
      await role.save();
      // convert roleName to camelCase and save in settings
      const camelCaseRoleName = _.camelCase(roleName);
      settings.roles = {
        ...settings.roles,
        [camelCaseRoleName]: role._id,
      };
      await settings.save();
      // console.log(settings)
    }
  } catch (error) {
    console.log(error);
  }
};

export default seed;
