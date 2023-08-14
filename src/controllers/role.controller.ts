import express, { query } from 'express';
import response from '../utilities/response';
import { QueryReturn, find, findOne } from '../utilities/query';
import { matched, validForm } from '../middlewares/validators';
import { Request, Response, NextFunction } from 'express';
import Role from '../models/role.model';
import {
  authenticate,
  authenticateAdmin,
  authenticateUser,
  checkUserTypes,
} from '../middlewares/authentication';
import RoleService from '../appservice/role.service';
import {
  canAssignRole,
  canCreateRole,
  canDeleteRole,
} from '../guards/role.guard';
import { isPermitted } from '../guards';

const router = express.Router();



router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    const permitted = await canCreateRole(req.user);
    if (!permitted?.auth) {
      return response(res, 401, permitted?.message);
    }
    const getRole = await RoleService.fetch(req.query, {
      ...permitted.query,
    });
    if (getRole.success) {
      return response(res, 200, getRole.message, getRole.data);
    }
    next(getRole.data);
  },
);

router.put(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    const permitted = await canCreateRole(req.user);
    if (!permitted?.auth) {
      return response(res, 401, permitted?.message);
    }
    const thebody = validForm(Role, req.body, false, {
      ...req.body,
    });
    const updateRole = await RoleService.updateOne(
      {
        ...permitted.query,
        _id: req.params.id,
      },
      {
        ...thebody,
      },
    );
    if (updateRole.success) {
      return response(res, 200, updateRole.message, updateRole.data);
    }
    next(updateRole.data);
  },
);

router.delete(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    const permitted = await canDeleteRole(req.user);
    if (!permitted?.auth) {
      return response(res, 401, permitted?.message);
    }
    const deleteRole = await RoleService.deleteOne(permitted.query);
    if (deleteRole.success) {
      return response(res, 200, deleteRole.message, deleteRole.data);
    }
    next(deleteRole.data);
  },
);



// Add Permission to role
router.put(
  '/:id/permission',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    const permitted = await isPermitted(req.user, 'assign:permission');
    const bodyPermissions: string[] = req.body.permissions;
    if (!permitted?.auth) {
      return response(res, 401, permitted?.message);
    }
    // Check if the body permission are in permitted.permissions array reject if not
    for (let i = 0; i < bodyPermissions.length; i++) {
      if (!permitted?.permissions?.includes(bodyPermissions[i])) {
        return response(
          res,
          401,
          `You are not permitted to assign ${bodyPermissions[i]} permission`,
        );
      }
    }
    const addPermission = await RoleService.assignPermissionsToRole(
      {
        ...permitted.query,
        _id: req.params.id,
      },
      bodyPermissions,
    );
    if (addPermission.success) {
      return response(res, 200, addPermission.message, addPermission.data);
    }
    next(addPermission.data);
  },
);

// Add Permission to user
router.put(
  '/:id/permission/user/:userId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    const permitted = await isPermitted(req.user, 'assign:permission');
    const bodyPermissions: string[] = req.body.permissions;
    if (!permitted?.auth) {
      return response(res, 401, permitted?.message);
    }
    // Check if the body permission are in permitted.permissions array reject if not
    for (let i = 0; i < bodyPermissions.length; i++) {
      if (!permitted?.permissions?.includes(bodyPermissions[i])) {
        return response(
          res,
          401,
          `You are not permitted to assign ${bodyPermissions[i]} permission`,
        );
      }
    }
    const addPermission = await RoleService.addPermissionToUser(
      {
        ...permitted.query,
        _id: req.params.userId,
      },
      bodyPermissions,
    );
    if (addPermission.success) {
      return response(res, 200, addPermission.message, addPermission.data);
    }
    next(addPermission.data);
  },
);

router.delete(
  '/:id/permission',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    const permitted = await isPermitted(req.user, 'assign:permission');
    const bodyPermissions: string[] = req.body.permissions;
    if (!permitted?.auth) {
      return response(res, 401, permitted?.message);
    }
    // Check if the body permission are in permitted.permissions array reject if not
    for (let i = 0; i < bodyPermissions.length; i++) {
      if (!permitted.permissions?.includes(bodyPermissions[i])) {
        return response(
          res,
          401,
          `You are not permitted to assign ${bodyPermissions[i]} permission`,
        );
      }
    }
    const removePermission = await RoleService.removePermissionFromRole(
      {
        ...permitted.query,
        _id: req.params.id,
      },
      bodyPermissions,
    );
    if (removePermission.success) {
      return response(
        res,
        200,
        removePermission.message,
        removePermission.data,
      );
    }
    next(removePermission.data);
  },
);

router.delete(
  '/:id/permission/user/:userId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    const permitted = await isPermitted(req.user, 'assign:permission');
    const bodyPermissions: string[] = req.body.permissions;
    if (!permitted?.auth) {
      return response(res, 401, permitted?.message);
    }
    // Check if the body permission are in permitted.permissions array reject if not
    for (let i = 0; i < bodyPermissions.length; i++) {
      if (!permitted?.permissions?.includes(bodyPermissions[i])) {
        return response(
          res,
          401,
          `You are not permitted to assign ${bodyPermissions[i]} permission`,
        );
      }
    }
    const removePermission = await RoleService.removePermissionFromUser(
      {
        ...permitted.query,
        _id: req.params.userId,
      },
      bodyPermissions,
    );
    if (removePermission.success) {
      return response(
        res,
        200,
        removePermission.message,
        removePermission.data,
      );
    }
    next(removePermission.data);
  },
);


export default router;
