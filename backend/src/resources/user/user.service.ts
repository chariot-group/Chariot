import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from '@/resources/user/dto/create-user.dto';
import { UpdateUserDto } from '@/resources/user/dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '@/resources/user/schemas/user.schema';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) { }

  private readonly SERVICE_NAME = UserService.name;
  private readonly logger = new Logger(this.SERVICE_NAME);

  async create(createUserDto: CreateUserDto) {
    try {
      const { campaigns = [], password, ...userData } = createUserDto;

      const checkUser = await this.userModel
        .findOne({ email: userData.email })
        .exec();

      if (checkUser) {
        const message = `User with email ${userData.email} already exists`;
        this.logger.error(message, null, this.SERVICE_NAME);
        throw new ConflictException(message);
      }

      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const start: number = Date.now();
      const user = await this.userModel.create({
        ...userData,
        password: hashedPassword,
        campaigns,
      });
      const end: number = Date.now();

      const message = `User created in ${end - start}ms`;
      this.logger.verbose(message, this.SERVICE_NAME);
      return {
        message,
        data: user,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = `Error while creating campaign: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }

  async findAll(query: {
    page?: number;
    offset?: number;
    sort?: string;
    email?: string;
  }) {
    try {
      const { page = 1, offset = 10, email = '' } = query;
      const skip = (page - 1) * offset;

      const filter = {
        email: { $regex: `${email}`, $options: 'i' },
        deletedAt: { $eq: null },
      };

      const sort: { [key: string]: 1 | -1 } = { updatedAt: 1 };

      if (query.sort) {
        query.sort.startsWith('-')
          ? (sort[query.sort.substring(1)] = -1)
          : (sort[query.sort] = 1);
      }

      const totalItems = await this.userModel.countDocuments(filter);

      const start: number = Date.now();
      const users = await this.userModel
        .find(filter)
        .skip(skip)
        .limit(offset)
        .sort(sort)
        .exec();
      const end: number = Date.now();

      const message = `Users found in ${end - start}ms`;
      this.logger.verbose(message, this.SERVICE_NAME);
      return {
        message,
        data: users,
        pagination: {
          page,
          offset,
          totalItems,
        },
      };
    } catch (error) {
      const message = `Error while fetching users: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }

  async findOne(id: Types.ObjectId) {
    try {
      const start: number = Date.now();
      const user = await this.userModel.findById(id).exec();
      const end: number = Date.now();

      const message = `User #${id} found in ${end - start}ms`;
      this.logger.verbose(message, this.SERVICE_NAME);
      return {
        message,
        data: user,
      };
    } catch (error) {
      const message = `Error while getting user #${id}: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }

  async findByEmail(email: string) {
    try {
      const start: number = Date.now();
      const user = await this.userModel.findOne({ email: email }).exec();
      const end: number = Date.now();

      if (!user) {
        const message = `User ${email} not found`;
        this.logger.error(message, null, this.SERVICE_NAME);
        return null;
      }

      if (user.deletedAt) {
        const message = `User ${email} is gone`;
        this.logger.error(message, null, this.SERVICE_NAME);
        return null;
      }

      const message = `User ${email} found in ${end - start}ms`;
      this.logger.verbose(message, this.SERVICE_NAME);

      return user;
    } catch (error) {
      const message = `Error while getting user: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      return null;
    }
  }

  async update(id: Types.ObjectId, updateUserDto: UpdateUserDto) {
    try {
      const start: number = Date.now();
      const userUpdate = await this.userModel
        .updateOne({ _id: id }, updateUserDto)
        .exec();
      const user = await this.userModel.findById(id).populate('campaigns').exec();
      const end: number = Date.now();

      if (!user || userUpdate.modifiedCount === 0) {
        const message = `User #${id} not found`;
        this.logger.error(message, null, this.SERVICE_NAME);
        throw new NotFoundException(message);
      }

      const message = `User #${id} update in ${end - start}ms`;
      this.logger.verbose(message, this.SERVICE_NAME);
      return {
        message,
        data: user,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = `Error while updating user #${id}: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }

  async remove(id: Types.ObjectId) {
    try {
      const start: number = Date.now();
      const user = await this.userModel.findById(id).exec();

      user.deletedAt = new Date();
      await user.save();

      const end: number = Date.now();

      const message = `User #${id} delete in ${end - start}ms`;
      this.logger.verbose(message, this.SERVICE_NAME);
      return {
        message,
        data: user,
      };
    } catch (error) {
      const message = `Error while deleting character #${id}: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }
}
