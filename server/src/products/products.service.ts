import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto, UpdateProductDto, FindManyProductsDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Product } from '@prisma/client';
import { PrismaError } from '../prisma/prisma-error';
import { removeWhiteSpaces } from '../common/utils';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create({ name, categoryIds, ...createProductDto }: CreateProductDto) {
    try {
      const newProduct = await this.prisma.product.create({
        data: {
          name: removeWhiteSpaces(name),
          ...createProductDto,

          categories: {
            connect: categoryIds.map((id) => ({ id })),
          },
        },
      });
      return newProduct;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case PrismaError.UniqueViolation:
            throw new BadRequestException({
              success: false,
              message: 'Product the given name already exists',
            });
          default:
            break;
        }
      }
      throw new InternalServerErrorException({
        success: false,
        message: 'Something went wrong',
      });
    }
  }

  async findAll({
    limit = 10,
    sortBy = 'id',
    order = 'asc',
    offset = 0,
    q = '',
    categoryIds,
    status = 'Active',
  }: FindManyProductsDto) {
    try {
      const where: Prisma.ProductWhereInput = {
        name: {
          search: q ? removeWhiteSpaces(q).split(' ').join(' & ') : undefined,
          mode: 'insensitive',
        },
        categories: { some: { id: { in: categoryIds } } },
        status,
      };
      let products = await this.prisma.product.findMany({
        take: limit,
        orderBy: { [sortBy]: order || 'asc' },
        skip: offset,
        where,
        include: {
          categories: true,
          variants: {
            select: {
              images: { select: { id: true }, take: 1 },
              color: true,
              size: true,
            },
          },
          _count: { select: { variants: true } },
        },
      });
      // for pagination
      const count = await this.prisma.product.count({ where });

      products = (await this.findPriceRange(products)) as any[];

      if (sortBy === 'price')
        products = products.sort((pa: any, pb: any) => {
          return order === 'asc'
            ? pa.priceRange[0] - pb.priceRange[0]
            : pb.priceRange[1] - pa.priceRange[1];
        });

      return { count, products };
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        message: error.message,
      });
    }
  }

  private async findPriceRange(products: Product[]) {
    for (let i in products) {
      const { _min, _max } = await this.prisma.variant.aggregate({
        _max: { price: true },
        _min: { price: true },
        where: { productId: products[i].id },
      });
      products[i] = {
        ...products[i],
        priceRange: [_min.price || 0.0, _max.price || 0.0],
      } as any;
    }
    return products as Product[];
  }

  async findOne(id: number, colorId?: number, sizeId?: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: { where: { colorId, sizeId } },
        categories: { select: { id: true } },
      },
    });
    if (!product)
      throw new NotFoundException({
        success: false,
        message: 'Cannot find product with the given `id`',
      });
    return product;
  }

  async update(
    id: number,
    { categoryIds, name, ...updateProductDto }: UpdateProductDto,
  ) {
    try {
      const product = await this.findOne(id);
      const data: Prisma.ProductUpdateInput = {
        name: removeWhiteSpaces(name),
        ...updateProductDto,
      };

      const existingCategoryIds = product.categories.map((c) => ({ id: c.id }));

      if (categoryIds) {
        data.categories = {
          disconnect: existingCategoryIds,
          connect: categoryIds.map((id) => ({ id })),
        };
      }

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data,
      });
      return updatedProduct;
    } catch (error) {
      switch (error.code) {
        case PrismaError.UniqueViolation:
          throw new BadRequestException({
            success: false,
            message: 'Product the given name already exists',
          });
        case PrismaError.RecordNotFound:
          throw new NotFoundException({
            success: false,
            message:
              'Cannot update product because either it or the given category is not found',
          });
        default:
          break;
      }
      throw new InternalServerErrorException({
        success: false,
        message: error.message,
      });
    }
  }

  remove(ids: number[]) {
    return this.prisma.$transaction(async (transactionClient) => {
      const { count } = await transactionClient.product.deleteMany({
        where: { id: { in: ids } },
      });
      if (count !== ids.length)
        throw new NotFoundException({
          success: false,
          message: `${
            ids.length - count
          } products were not deleted because they were not found`,
        });
    });
  }
}
