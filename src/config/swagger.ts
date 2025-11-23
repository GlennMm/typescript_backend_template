import swaggerJsdoc from "swagger-jsdoc";
import type { OAS3Options } from "swagger-jsdoc";

const options: OAS3Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Multi-Branch POS System API",
      version: "1.0.0",
      description:
        "Complete API documentation for the multi-branch Point of Sale system with inventory management, staff assignments, and customer tracking.",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "https://api.production.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
      },
      parameters: {
        tenantId: {
          name: "X-Tenant-ID",
          in: "header",
          required: true,
          schema: {
            type: "string",
          },
          description: "Tenant identifier",
        },
        branchId: {
          name: "X-Branch-ID",
          in: "header",
          required: false,
          schema: {
            type: "string",
          },
          description: "Branch identifier (optional)",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  example: "Error description",
                },
                code: {
                  type: "string",
                  example: "ERROR_CODE",
                },
                details: {
                  type: "object",
                },
              },
            },
          },
        },
        ShopSettings: {
          type: "object",
          properties: {
            id: { type: "string" },
            companyName: { type: "string" },
            tradingName: { type: "string" },
            vatNumber: { type: "string" },
            tinNumber: { type: "string" },
            businessRegistrationNumber: { type: "string" },
            defaultTaxRate: { type: "number" },
            addressLine1: { type: "string" },
            addressLine2: { type: "string" },
            city: { type: "string" },
            stateProvince: { type: "string" },
            postalCode: { type: "string" },
            country: { type: "string" },
            phoneNumber: { type: "string" },
            alternativePhone: { type: "string" },
            email: { type: "string" },
            faxNumber: { type: "string" },
            website: { type: "string" },
            defaultCurrency: { type: "string" },
            defaultTimezone: { type: "string" },
            logoUrl: { type: "string" },
            defaultReceiptHeader: { type: "string" },
            defaultReceiptFooter: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Branch: {
          type: "object",
          properties: {
            id: { type: "string" },
            code: { type: "string" },
            name: { type: "string" },
            managerId: { type: "string" },
            isActive: { type: "boolean" },
            useShopVat: { type: "boolean" },
            useShopTin: { type: "boolean" },
            useShopAddress: { type: "boolean" },
            addressLine1: { type: "string" },
            city: { type: "string" },
            phoneNumber: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Product: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            sku: { type: "string" },
            barcode: { type: "string" },
            categoryId: { type: "string" },
            categoryName: { type: "string" },
            description: { type: "string" },
            price: { type: "number" },
            cost: { type: "number" },
            unit: { type: "string" },
            imageUrl: { type: "string" },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ProductCategory: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            parentId: { type: "string" },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Inventory: {
          type: "object",
          properties: {
            id: { type: "string" },
            productId: { type: "string" },
            productName: { type: "string" },
            productSku: { type: "string" },
            unit: { type: "string" },
            quantity: { type: "number" },
            minimumStock: { type: "number" },
            maximumStock: { type: "number" },
            lastRestocked: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        InventoryTransfer: {
          type: "object",
          properties: {
            id: { type: "string" },
            productId: { type: "string" },
            productName: { type: "string" },
            fromBranchId: { type: "string" },
            fromBranchName: { type: "string" },
            toBranchId: { type: "string" },
            toBranchName: { type: "string" },
            quantity: { type: "number" },
            status: {
              type: "string",
              enum: ["pending", "approved", "rejected", "completed"],
            },
            notes: { type: "string" },
            requestedBy: { type: "string" },
            approvedBy: { type: "string" },
            requestedAt: { type: "string", format: "date-time" },
            approvedAt: { type: "string", format: "date-time" },
            completedAt: { type: "string", format: "date-time" },
          },
        },
        Customer: {
          type: "object",
          properties: {
            id: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            address: { type: "string" },
            dateOfBirth: { type: "string", format: "date-time" },
            loyaltyPoints: { type: "number" },
            lastPurchaseAt: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: "Authentication",
        description: "Authentication and authorization endpoints",
      },
      {
        name: "Shop Settings",
        description: "Tenant-wide business configuration",
      },
      {
        name: "Branches",
        description: "Branch management with settings inheritance",
      },
      {
        name: "Staff",
        description: "Staff assignment and transfers",
      },
      {
        name: "Products",
        description: "Product catalog and categories",
      },
      {
        name: "Inventory",
        description: "Inventory management and stock tracking",
      },
      {
        name: "Transfers",
        description: "Inter-branch inventory transfers",
      },
      {
        name: "Customers",
        description: "Customer management",
      },
      {
        name: "Users",
        description: "User management",
      },
      {
        name: "Tenants",
        description: "Tenant management (SuperAdmin only)",
      },
    ],
  },
  apis: ["./src/features/**/*.routes.ts", "./src/app.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
