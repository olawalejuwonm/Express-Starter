import {
    prop,
    Ref,
    type DocumentType,
    plugin,
    modelOptions,
  } from '@typegoose/typegoose';
  import passportLocalMongoose from 'passport-local-mongoose';
  import idValidator from 'mongoose-id-validator2';
  import { type PassportLocalDocument } from 'mongoose';
import { signJWT } from '../../utilities/jwt';
  
  const options = {
    errorMessages: {
      MissingPasswordError: 'Incorrect Email or Password, Please try again',
      AttemptTooSoonError: 'Account is currently locked. Try again later',
      TooManyAttemptsError:
        'Account locked due to too many failed login attempts',
      NoSaltValueStoredError:
        "You've registered using other login method. Please login with that method",
      IncorrectPasswordError: 'Incorrect Email or Password, Please try again',
      IncorrectUsernameError: 'Incorrect Email or Password, Please try again',
      MissingUsernameError: 'Incorrect Email or Password, Please try again',
      UserExistsError: 'A user with this email already exists',
    },
  };
  
  export enum UserTypes {
    INDIVIDUAL = 'individual',
    ARTISAN = 'artisan',
    SUPER = 'super',
    ADMIN = 'admin',
    EMPLOYER = 'employer',
  }
  
  export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
    REJECTED = 'rejected',
  }
  
  @plugin(idValidator)
  @plugin(passportLocalMongoose, {
    ...options,
    usernameField: 'email',
    attemptsField: 'loginAttempts',
    lastLoginField: 'lastLogin',
    usernameLowerCase: true,
  })
  @modelOptions({
    schemaOptions: {
      timestamps: true,
      // toJSON: {
      //   virtuals: true,
      //   getters: true,
      // },
    },
  })
  export class User {
    @prop({
      unique: true,
      index: true,
      sparse: true,
      required: true,
      source: 'body',
      comment: "This is an email only for the user's login",
      lowercase: true,
      trim: true,
    })
    email!: string;

    @prop({ required: true })
    firstName!: string;

    @prop({ required: true })
    lastName!: string;
  
    @prop({ required: true, unique: true })
    phone!: string;
  
    @prop({ immutable: true })
    lastLogin?: Date;
  
    @prop({ immutable: true })
    lastActive?: Date;
  
    @prop({ default: false })
    emailVerified!: boolean;
  
    @prop({ default: false })
    phoneVerified!: boolean;
  
    @prop({
      enum: UserTypes,
      immutable: true,
      required: true,
    })
    type!: UserTypes;
  
    @prop({ default: false, immutable: true, type: Boolean })
    isAdmin!: boolean;
  
    @prop({
      enum: UserStatus,
      immutable: false,
      default: function () {
        const mythis = this as User;
        if (mythis.type === 'individual') {
          return 'active';
        }
        return 'inactive';
      },
    })
    status!: UserStatus;
  
    @prop({ ref: 'Role', immutable: true })
    roles?: Ref<'Role'>[];
  
    @prop({ ref: 'Permission', immutable: true })
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
  
  export type UserType = DocumentType<User>;
  // interface IUserType extends DocumentType<User>, Omit<PassportLocalDocument, mongoose.Doc>,
  export type AllUserType = PassportLocalDocument & DocumentType<User>;
  