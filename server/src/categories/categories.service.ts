import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaError } from '../prisma/prisma-error';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { FindManyDto } from '../common/dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    try {
      const newCategory = await this.prisma.category.create({
        data: dto,
      });
      return newCategory;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === PrismaError.UniqueViolation)
          throw new BadRequestException({
            success: false,
            message: 'Duplicate slug',
          });
      }
      throw new InternalServerErrorException({
        success: false,
        message: 'Something went wrong',
      });
    }
  }

  private formQueries({ q, sortBy, order }: FindManyDto, slug: string = null) {
    const where: Prisma.CategoryWhereInput = {
      parentCategory: { slug },
      name: {
        contains: q,
        mode: 'insensitive',
      },
    };
    let orderBy = {};
    if (sortBy === 'products') orderBy = { products: { _count: order } };
    else orderBy = { [sortBy]: order };
    return { where, orderBy };
  }

  async findBySlug(
    { limit, offset = 0, ...findManyCategoriesDto }: FindManyDto,
    slug: string = null,
  ) {
    const { where, orderBy } = this.formQueries(findManyCategoriesDto, slug);

    try {
      const categories = await this.prisma.category.findMany({
        take: limit,
        orderBy,
        skip: offset,
        where,
        include: {
          _count: { select: { subCategories: true, products: true } },
        },
      });

      const parents = await this.prisma.category.findUnique({
        where: { slug },
        include: {
          parentCategory: {
            select: {
              slug: true,
              name: true,
              parentCategory: { select: { slug: true, name: true } },
            },
          },
        },
      });

      const count = await this.prisma.category.count({
        where,
      });
      return {
        count,
        categories,
        parents,
      };
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        message: error.message,
      });
    }
  }

  async findCategoriesTree() {
    const categories = await this.prisma.category.findMany({
      include: {
        subCategories: {
          include: { subCategories: { include: { subCategories: true } } },
        },
      },
    });
    return categories;
  }

  async update(id: number, dto: UpdateCategoryDto) {
    try {
      const updatedCategory = await this.prisma.category.update({
        where: { id },
        data: dto,
      });
      return updatedCategory;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === PrismaError.UniqueViolation)
          throw new BadRequestException({
            success: false,
            message: 'Duplicate slug',
          });
        if (error.code === PrismaError.RecordNotFound)
          throw new NotFoundException({
            success: false,
            message:
              'Cannot update the category because it is not found with the given `id`',
          });
      }
      throw new InternalServerErrorException({
        success: false,
        message: error.message,
      });
    }
  }

  async remove(ids: number[]) {
    return this.prisma.$transaction(async (transactionClient) => {
      try {
        const { count } = await transactionClient.category.deleteMany({
          where: { id: { in: ids } },
        });
        if (count !== ids.length)
          throw new NotFoundException({
            success: false,
            message: `${
              ids.length - count
            } categories were not deleted because they were not found`,
          });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError)
          if (error.code === PrismaError.ForeignViolation)
            throw new ForbiddenException({
              success: false,
              message:
                'Cannot delete categories because they are linked to existing products',
            });
        if (error instanceof NotFoundException) throw error;
        throw new InternalServerErrorException({
          success: false,
          message: 'Something went wrong',
        });
      }
    });
  }
}
