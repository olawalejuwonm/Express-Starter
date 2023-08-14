import {
  prop,
  getModelForClass,
  Ref,
  DocumentType,
  plugin,
  ReturnModelType,
} from '@typegoose/typegoose';
import passportLocalMongoose from 'passport-local-mongoose';
import idValidator from 'mongoose-id-validator2';
import { signJWT } from '../utilities/jwt';
import {
  InferSchemaType,
  PassportLocalDocument,
  PassportLocalModel,
  Types,
} from 'mongoose';
import { Profile } from './profileModel';

const options = {
  errorMessages: {
    MissingPasswordError: 'Incorrect details. Kindly double check',
    AttemptTooSoonError: 'Account is currently locked. Try again later',
    TooManyAttemptsError:
      'Account locked due to too many failed login attempts',
    NoSaltValueStoredError:
      "You've registered using other login method. Please login with that method",
    IncorrectPasswordError: 'Incorrect details. Kindly double check',
    IncorrectUsernameError: 'Incorrect details. Kindly double check',
    MissingUsernameError: 'Incorrect details. Kindly double check',
    UserExistsError: 'A user with this credential already exists',
  },
};

export type UserModelType = typeof UserModel &
  PassportLocalModel<DocumentType<User>>;

// export type UserType = typeof UserModel;

// | PassportLocalModel<DocumentType<User>>;

// id false

export enum UserTypes {
  INDIVIDUAL = 'individual',
  SUPER = 'super',
  ADMIN = 'admin',
}

export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@plugin(idValidator)
@plugin(passportLocalMongoose, {
  ...options,
  usernameField: 'email',
  attemptsField: 'loginAttempts',
  lastLoginField: 'lastLogin',
  usernameLowerCase: true,
})
export class User {
  @prop({
    unique: true,
    immutable: true,
    index: true,
    sparse: true,
    required: true,
    source: 'body',
    comment: "This is an email only for the user's login",
  })
  email!: string;

  @prop({ required: true, immutable: true })
  phone!: string;

  @prop({ autopopulate: true, ref: 'Profile', required: true })
  profile: string;

  @prop()
  lastLogin?: string;

  @prop({ default: false, immutable: true })
  emailVerified!: boolean;

  @prop({
    enum: UserTypes,
    immutable: true,
    required: true,
    source: 'body',
  })
  type!: UserTypes;

  @prop({ default: false, immutable: true, type: Boolean })
  isAdmin!: boolean;

  @prop({
    enum: Status,
    immutable: false,
    default: function () {
      const mythis = this as any;
      if (mythis.type === 'student') {
        return 'active';
      }
      return 'inactive';
    },
  })
  status!: Status;

  @prop({ ref: 'Role' })
  roles?: Ref<'Role'>[];

  @prop({ ref: 'Permission' })
  permissions?: Ref<'Permission'>[];

  public async generateJWT(this: DocumentType<User>): Promise<string> {
    const payload = {
      id: this._id,
    };
    if (this.isAdmin) {
      return signJWT(
        payload,
        process.env.ADMIN_JWT_SECRET,
        process.env.ADMIN_TOKEN_EXPIRY,
      );
    }
    return signJWT(
      payload,
      process.env.USER_JWT_SECRET,
      process.env.USER_TOKEN_EXPIRY,
    );
  }

  public toJSON(this: DocumentType<User>) {
    const user = this.toObject() as UserType | any;
    delete user.salt;
    delete user.hash;
    delete user.__v;
    delete user.deleted;
    return user;
  }
}

const UserModel = getModelForClass(User, {
  schemaOptions: {
    timestamps: true,
    // toJSON: {
    //   virtuals: true,
    //   getters: true,
    // },
  },
});

export type UserType = DocumentType<User>;
// interface IUserType extends DocumentType<User>, Omit<PassportLocalDocument, mongoose.Doc>,
export type AllUserType = PassportLocalDocument & DocumentType<User>;

// export type UserType =
//   | (PassportLocalDocument & SoftDeleteInterface & DocumentType<User>)
//   | DocumentType<User>;
export default <UserModelType>UserModel;
