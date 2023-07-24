import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import { CreateUserDto } from './dto';
import { createRandomUser } from '../common/__mocks__';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;
  let user: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    user = createRandomUser();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('when creating a user', () => {
    let createUserDto: CreateUserDto;
    beforeAll(() => {
      createUserDto = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: user.password,
      };
    });

    it('should create the user', async () => {
      jest.spyOn(prisma.user, 'create').mockResolvedValueOnce(user);

      const result = await service.create(createUserDto);
      expect(result).toEqual(user);
      expect(prisma.user.create).toHaveBeenCalledWith({ data: createUserDto });
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('when finding a user by email', () => {
    it('should return the user when found by email', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(user);
      const result = await service.findByEmail(user.email);
      expect(result).toEqual(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: user.email },
      });
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should throw an error when the user is not found by the given email', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.findByEmail(user.email)).rejects.toThrowError(
        'User with that email does not exist',
      );
    });
  });

  describe('when finding a user by id', () => {
    it('should return the user when found by id', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(user);
      const result = await service.findById(user.id);
      expect(result).toEqual(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: user.id },
      });
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
    });
  });
});
