import express, { Request, Response, NextFunction } from "express";
import request from "supertest";
import path from "path";
import { MediaController } from "../controllers/media.controller";
import { richTextUpload, richTextUploadMiddleware } from "../routes/media.routes";
import { errorHandler } from "../middlewares/errorHandler";
import { AppError } from "../utils/AppError";
import { AuthRequest } from "../middlewares/auth";

// Mock user context for media upload tests
const adminUserWithMediaWrite = {
  id: "admin-1",
  email: "admin@example.com",
  roleId: "role-admin",
  roleName: "SuperAdmin",
  permissions: [{ module: "Media", action: "Write" }],
};

const userWithoutMediaWrite = {
  id: "user-2",
  email: "staff@example.com",
  roleId: "role-staff",
  roleName: "Staff",
  permissions: [{ module: "Products", action: "Read" }],
};

function createRichTextUploadTestApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Test auth middleware
  const mockAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("You are not logged in! Please log in to get access.", 401, "UNAUTHORIZED"));
    }

    const token = authHeader.split(" ")[1];
    if (token === "invalid-token" || token === "expired-token") {
      return next(new AppError("Invalid or expired token", 401, "UNAUTHORIZED"));
    }

    if (token === "token-media-admin") {
      req.user = adminUserWithMediaWrite as any;
      return next();
    }

    if (token === "token-no-permission") {
      req.user = userWithoutMediaWrite as any;
      return next();
    }

    return next(new AppError("Invalid or expired token", 401, "UNAUTHORIZED"));
  };

  // Test permission middleware
  const mockPermissionMiddleware = (module: string, action: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new AppError("User not authenticated", 401, "UNAUTHORIZED"));
      }

      if (req.user.roleName === "SuperAdmin") {
        return next();
      }

      const hasPerm = req.user.permissions?.some(
        (p: any) =>
          p.module.toLowerCase() === module.toLowerCase() &&
          (p.action.toLowerCase() === action.toLowerCase() || p.action.toLowerCase() === "all")
      );

      if (!hasPerm) {
        return next(
          new AppError(
            `You do not have permission (${module}.${action}) to perform this action`,
            403,
            "FORBIDDEN"
          )
        );
      }

      next();
    };
  };

  // Primary endpoint
  app.post(
    "/api/v1/media/rich-text-image",
    mockAuthMiddleware,
    mockPermissionMiddleware("Media", "Write"),
    richTextUploadMiddleware,
    MediaController.uploadRichTextImage
  );

  // Alias endpoint
  app.post(
    "/api/v1/uploads/rich-text-image",
    mockAuthMiddleware,
    mockPermissionMiddleware("Media", "Write"),
    richTextUploadMiddleware,
    MediaController.uploadRichTextImage
  );

  app.use(errorHandler);
  return app;
}

async function runRichTextUploadTests() {
  console.log("\n=================================================");
  console.log("RICH TEXT EDITOR IMAGE UPLOADER TEST SUITE");
  console.log("=================================================\n");

  const app = createRichTextUploadTestApp();
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, name: string, details?: string) => {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}${details ? `: ${details}` : ""}`);
      failed++;
    }
  };

  try {
    // 1. Authenticated Upload Test (valid PNG image)
    const validImageBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    const resValid = await request(app)
      .post("/api/v1/media/rich-text-image")
      .set("Authorization", "Bearer token-media-admin")
      .field("folder", "products")
      .attach("file", validImageBuffer, {
        filename: "test-product-desc.png",
        contentType: "image/png",
      });

    assert(
      resValid.status === 201 &&
        resValid.body.success === true &&
        typeof resValid.body.url === "string" &&
        typeof resValid.body.publicId === "string" &&
        resValid.body.data !== undefined,
      "TEST 1: Authenticated admin upload succeeds with 201, Cloudinary URL and publicId"
    );

    // 2. Alias Endpoint Upload Test (/api/v1/uploads/rich-text-image)
    const resAlias = await request(app)
      .post("/api/v1/uploads/rich-text-image")
      .set("Authorization", "Bearer token-media-admin")
      .field("folder", "blog")
      .attach("image", validImageBuffer, {
        filename: "test-blog-cover.jpg",
        contentType: "image/jpeg",
      });

    assert(
      resAlias.status === 201 &&
        resAlias.body.success === true &&
        typeof resAlias.body.url === "string",
      "TEST 2: Alias endpoint (/api/v1/uploads/rich-text-image) accepts 'image' field and succeeds"
    );

    // 3. Unauthorized Upload Test (no token)
    const resNoAuth = await request(app)
      .post("/api/v1/media/rich-text-image")
      .attach("file", validImageBuffer, {
        filename: "test.png",
        contentType: "image/png",
      });

    assert(
      resNoAuth.status === 401 && resNoAuth.body.error?.code === "UNAUTHORIZED",
      "TEST 3: Unauthorized upload without token returns HTTP 401 UNAUTHORIZED"
    );

    // 4. Forbidden Upload Test (token without Media.Write permission)
    const resForbidden = await request(app)
      .post("/api/v1/media/rich-text-image")
      .set("Authorization", "Bearer token-no-permission")
      .attach("file", validImageBuffer, {
        filename: "test.png",
        contentType: "image/png",
      });

    assert(
      resForbidden.status === 403 && resForbidden.body.error?.code === "FORBIDDEN",
      "TEST 4: User lacking Media.Write permission returns HTTP 403 FORBIDDEN"
    );

    // 5. Non-Image Upload Test (disallowed HTML or SVG/executable file)
    const textBuffer = Buffer.from("<h1>Hello World</h1><script>alert(1)</script>");

    const resHtml = await request(app)
      .post("/api/v1/media/rich-text-image")
      .set("Authorization", "Bearer token-media-admin")
      .attach("file", textBuffer, {
        filename: "malicious.html",
        contentType: "text/html",
      });

    assert(
      resHtml.status === 400,
      "TEST 5: Non-image file upload (e.g. text/html) is rejected with HTTP 400"
    );

    // 6. SVG Disallowed Test (preventing SVG XSS vectors in rich-text)
    const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

    const resSvg = await request(app)
      .post("/api/v1/media/rich-text-image")
      .set("Authorization", "Bearer token-media-admin")
      .attach("file", svgBuffer, {
        filename: "exploit.svg",
        contentType: "image/svg+xml",
      });

    assert(
      resSvg.status === 400,
      "TEST 6: SVG file upload is rejected for Rich Text Editor images to prevent XSS"
    );

    // 7. Oversized Upload Test (> 10MB)
    const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

    const resOversized = await request(app)
      .post("/api/v1/media/rich-text-image")
      .set("Authorization", "Bearer token-media-admin")
      .attach("file", oversizedBuffer, {
        filename: "giant-image.jpg",
        contentType: "image/jpeg",
      });

    assert(
      resOversized.status === 400 &&
        (resOversized.body.error?.code === "FILE_TOO_LARGE" ||
          resOversized.body.error?.message?.includes("10MB")),
      "TEST 7: Oversized image (>10MB) returns HTTP 400 FILE_TOO_LARGE"
    );

    // 8. Missing File Payload Test
    const resNoFile = await request(app)
      .post("/api/v1/media/rich-text-image")
      .set("Authorization", "Bearer token-media-admin")
      .send({ folder: "products" });

    assert(
      resNoFile.status === 400 && resNoFile.body.error?.code === "BAD_REQUEST",
      "TEST 8: Request missing file payload returns HTTP 400 BAD_REQUEST"
    );

    console.log("\n=================================================");
    console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error("Test execution error:", err);
    process.exit(1);
  }
}

runRichTextUploadTests();
