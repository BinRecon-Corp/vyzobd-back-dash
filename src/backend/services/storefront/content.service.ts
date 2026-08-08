import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class StorefrontContentService {
  async getPages() {
    return prisma.page.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
      },
      include: {
        seoMetadata: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getPageBySlug(slug: string) {
    return prisma.page.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
        deletedAt: null,
      },
      include: {
        seoMetadata: true,
      },
    });
  }

  async getBlogPosts() {
    return prisma.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
      },
      include: {
        category: true,
        tags: true,
        featuredImage: true,
        seoMetadata: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
    });
  }

  async getBlogPostBySlug(slug: string) {
    return prisma.blogPost.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
        deletedAt: null,
      },
      include: {
        category: true,
        tags: true,
        featuredImage: true,
        seoMetadata: true,
      },
    });
  }

  async getFaqs() {
    return prisma.fAQ.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      include: {
        category: true,
      },
      orderBy: {
        orderIndex: "asc",
      },
    });
  }

  async getLandingPageBySlug(slug: string) {
    return prisma.landingPage.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
        deletedAt: null,
      },
      include: {
        seoMetadata: true,
      },
    });
  }
}

export const storefrontContentService = new StorefrontContentService();
