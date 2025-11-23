# POS System API Documentation

Complete API reference for the multi-branch Point of Sale (POS) system.

## Table of Contents

- [Authentication](#authentication)
- [Shop Settings](#shop-settings)
- [Branch Management](#branch-management)
- [Staff Management](#staff-management)
- [Product Management](#product-management)
- [Inventory Management](#inventory-management)
- [Inventory Transfers](#inventory-transfers)
- [Customer Management](#customer-management)
- [User Management](#user-management)
- [Tenant Management](#tenant-management)

---

## Base URL

```
http://localhost:3000/api
```

## Authentication

All API requests (except login/register) require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Tenant Context

Most endpoints require a tenant context, provided via the `X-Tenant-ID` header:

```
X-Tenant-ID: <tenant-id>
```

### Branch Context (Optional)

Some endpoints support branch context via the `X-Branch-ID` header:

```
X-Branch-ID: <branch-id>
```

---

## Roles & Permissions

| Role | Description | Access Level |
|------|-------------|--------------|
| `SuperAdmin` | Platform administrator | All tenants |
| `TenantAdmin` | Tenant administrator | Tenant-wide |
| `ShopOwner` | Shop owner | All branches in tenant |
| `BranchManager` | Branch manager | Assigned branch(es) |
| `Supervisor` | Branch supervisor | Assigned branch(es) |
| `Cashier` | Cashier/sales person | Assigned branch(es) |
| `TenantUser` | Basic tenant user | Limited access |

---

## Authentication Endpoints

### Super Admin Login

```http
POST /api/auth/admin/login
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "Password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user-id",
      "email": "admin@example.com",
      "role": "SuperAdmin"
    }
  }
}
```

### Tenant User Login

```http
POST /api/auth/login
Headers: X-Tenant-ID: <tenant-id>
```

**Request Body:**
```json
{
  "email": "user@shop.com",
  "password": "Password123"
}
```

### Tenant User Registration

```http
POST /api/auth/register
Headers: X-Tenant-ID: <tenant-id>
```

**Request Body:**
```json
{
  "email": "newuser@shop.com",
  "password": "Password123",
  "name": "John Doe",
  "role": "TenantUser"
}
```

### Refresh Token

```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Logout

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Change Password

```http
POST /api/auth/change-password
Headers: X-Tenant-ID, Authorization
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

---

## Shop Settings

Manage tenant-wide business configuration.

### Get Shop Settings

```http
GET /api/shop/settings
Headers: X-Tenant-ID, Authorization
Roles: ShopOwner, TenantAdmin
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "settings-id",
    "companyName": "ABC Retail Ltd",
    "tradingName": "ABC Stores",
    "vatNumber": "VAT-12345",
    "tinNumber": "TIN-67890",
    "businessRegistrationNumber": "REG-2024-001",
    "defaultTaxRate": 15.0,
    "addressLine1": "123 Main St",
    "addressLine2": "Suite 100",
    "city": "Accra",
    "stateProvince": "Greater Accra",
    "postalCode": "GA-123-4567",
    "country": "Ghana",
    "phoneNumber": "+233-24-123-4567",
    "email": "info@abcretail.com",
    "defaultCurrency": "GHS",
    "defaultTimezone": "Africa/Accra",
    "logoUrl": "/uploads/logo.png",
    "defaultReceiptHeader": "Welcome to ABC Retail",
    "defaultReceiptFooter": "Thank you for shopping with us!",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Create Shop Settings

```http
POST /api/shop/settings
Headers: X-Tenant-ID, Authorization
Roles: ShopOwner, TenantAdmin
```

**Request Body:**
```json
{
  "companyName": "ABC Retail Ltd",
  "vatNumber": "VAT-12345",
  "tinNumber": "TIN-67890",
  "defaultTaxRate": 15.0,
  "addressLine1": "123 Main St",
  "city": "Accra",
  "postalCode": "GA-123-4567",
  "country": "Ghana",
  "phoneNumber": "+233-24-123-4567",
  "email": "info@abcretail.com",
  "defaultCurrency": "GHS"
}
```

### Update Shop Settings

```http
PUT /api/shop/settings
Headers: X-Tenant-ID, Authorization
Roles: ShopOwner, TenantAdmin
```

**Request Body:** Same as Create (all fields optional)

---

## Branch Management

Manage shop locations with settings inheritance.

### List All Branches

```http
GET /api/branches
Headers: X-Tenant-ID, Authorization
Roles: All authenticated users
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "branch-id",
      "code": "ACC-01",
      "name": "Accra Main Branch",
      "managerId": "user-id",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Get Branch Details

```http
GET /api/branches/:id
Headers: X-Tenant-ID, Authorization
Roles: All authenticated users
```

### Get Effective Branch Settings

Returns branch settings with inheritance resolved.

```http
GET /api/branches/:id/effective-settings
Headers: X-Tenant-ID, Authorization
Roles: All authenticated users
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vatNumber": "VAT-12345",
    "tinNumber": "TIN-67890",
    "taxRate": 15.0,
    "addressLine1": "45 Oxford Street",
    "city": "Accra",
    "postalCode": "GA-100-0001",
    "country": "Ghana",
    "phoneNumber": "+233-24-100-0001",
    "email": "accra@abcretail.com",
    "currency": "GHS",
    "timezone": "Africa/Accra",
    "receiptHeader": "Welcome to Accra Branch",
    "receiptFooter": "Thank you!"
  }
}
```

### Create Branch

```http
POST /api/branches
Headers: X-Tenant-ID, Authorization
Roles: ShopOwner, TenantAdmin
```

**Request Body:**
```json
{
  "code": "KUM-01",
  "name": "Kumasi Branch",
  "useShopVat": true,
  "useShopTin": true,
  "useShopAddress": false,
  "addressLine1": "12 Prempeh II Street",
  "city": "Kumasi",
  "postalCode": "KM-200-0001",
  "country": "Ghana",
  "phoneNumber": "+233-24-200-0002",
  "managerId": "user-id",
  "isActive": true
}
```

### Update Branch

```http
PUT /api/branches/:id
Headers: X-Tenant-ID, Authorization
Roles: ShopOwner, TenantAdmin, BranchManager (own branch)
```

**Request Body:** Same as Create (all fields optional)

### Delete Branch

```http
DELETE /api/branches/:id
Headers: X-Tenant-ID, Authorization
Roles: ShopOwner, TenantAdmin
```

### Toggle Inheritance

```http
PATCH /api/branches/:id/inherit
Headers: X-Tenant-ID, Authorization
Roles: ShopOwner, TenantAdmin
```

**Request Body:**
```json
{
  "field": "vat",
  "inherit": true
}
```

**Available fields:** `vat`, `tin`, `businessReg`, `taxRate`, `address`, `contact`, `currency`, `receipts`

---

## Staff Management

Manage staff assignments to branches.

### Get Branch Staff

```http
GET /api/branches/:id/staff
Headers: X-Tenant-ID, Authorization
Roles: All authenticated users
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "assignmentId": "assignment-id",
      "userId": "user-id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "BranchManager",
      "roleAtBranch": "BranchManager",
      "assignedAt": "2024-01-01T00:00:00Z",
      "assignedBy": "admin-user-id"
    }
  ]
}
```

### Assign Staff to Branch

```http
POST /api/branches/:id/staff
Headers: X-Tenant-ID, Authorization
Roles: ShopOwner, TenantAdmin, BranchManager
```

**Request Body:**
```json
{
  "userId": "user-id",
  "roleAtBranch": "Supervisor"
}
```

### Remove Staff from Branch

```http
DELETE /api/branches/:id/staff/:userId
Headers: X-Tenant-ID, Authorization
Roles: ShopOwner, TenantAdmin, BranchManager
```

### Transfer Staff Between Branches

```http
POST /api/branches/staff/transfer
Headers: X-Tenant-ID, Authorization
Roles: ShopOwner, TenantAdmin
```

**Request Body:**
```json
{
  "userId": "user-id",
  "fromBranchId": "branch-1-id",
  "toBranchId": "branch-2-id",
  "roleAtNewBranch": "Cashier"
}
```

---

## Product Management

Manage product catalog and categories.

### Product Categories

#### List All Categories

```http
GET /api/products/categories
Headers: X-Tenant-ID, Authorization
Roles: All authenticated users
```

#### Get Category Details

```http
GET /api/products/categories/:id
Headers: X-Tenant-ID, Authorization
Roles: All authenticated users
```

#### Create Category

```http
POST /api/products/categories
Headers: X-Tenant-ID, Authorization
Roles: ShopOwner, TenantAdmin, BranchManager
```

**Request Body:**
```json
{
  "name": "Electronics",
  "description": "Electronic products",
  "parentId": "parent-category-id",
  "isActive": true
}
```

#### Update Category

```http
PUT /api/products/categories/:id
Headers: X-Tenant-ID, Authorization
Roles: ShopOwner, TenantAdmin, BranchManager
```

#### Delete Category

```http
DELETE /api/products/categories/:id
Headers: X-Tenant-ID, Authorization
Roles: ShopOwner, TenantAdmin
```

### Products

#### List All Products

```http
GET /api/products
Headers: X-Tenant-ID, Authorization
Roles: All authenticated users
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "product-id",
      "name": "Laptop HP ProBook",
      "sku": "LAP-HP-001",
      "barcode": "1234567890123",
      "categoryId": "category-id",
      "categoryName": "Electronics",
      "price": 2500.00,
      "cost": 2000.00,
      "unit": "piece",
      "imageUrl": "/uploads/products/laptop.jpg",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Get Product Details

```http
GET /api/products/:id
Headers: X-Tenant-ID, Authorization
Roles: All authenticated users
```

#### Create Product

```http
POST /api/products
Headers: X-Tenant-ID, Authorization
Roles: ShopOwner, TenantAdmin, BranchManager
```

**Request Body:**
```json
{
  "name": "Laptop HP ProBook",
  "sku": "LAP-HP-001",
  "barcode": "1234567890123",
  "categoryId": "category-id",
  "description": "HP ProBook 450 G8",
  "price": 2500.00,
  "cost": 2000.00,
  "unit": "piece",
  "imageUrl": "/uploads/products/laptop.jpg",
  "isActive": true
}
```

#### Update Product

```http
PUT /api/products/:id
Headers: X-Tenant-ID, Authorization
Roles: ShopOwner, TenantAdmin, BranchManager
```

**Request Body:** Same as Create (all fields optional)

#### Delete Product

```http
DELETE /api/products/:id
Headers: X-Tenant-ID, Authorization
Roles: ShopOwner, TenantAdmin
```

---

## Inventory Management

Manage stock levels per branch.

### Get Branch Inventory

```http
GET /api/inventory/branches/:branchId
Headers: X-Tenant-ID, Authorization
Roles: All authenticated users
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "inventory-id",
      "productId": "product-id",
      "productName": "Laptop HP ProBook",
      "productSku": "LAP-HP-001",
      "unit": "piece",
      "quantity": 15,
      "minimumStock": 5,
      "maximumStock": 50,
      "lastRestocked": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Get Product Inventory at Branch

```http
GET /api/inventory/branches/:branchId/products/:productId
Headers: X-Tenant-ID, Authorization
Roles: All authenticated users
```

### Adjust Inventory

Add or remove stock (positive or negative quantity).

```http
POST /api/inventory/branches/:branchId/adjust
Headers: X-Tenant-ID, Authorization
Roles: ShopOwner, TenantAdmin, BranchManager, Supervisor
```

**Request Body:**
```json
{
  "productId": "product-id",
  "quantity": 10,
  "reason": "Stock replenishment"
}
```

Use negative quantity to reduce stock:
```json
{
  "productId": "product-id",
  "quantity": -5,
  "reason": "Damaged items removed"
}
```

### Set Inventory

Replace inventory quantity and set min/max levels.

```http
PUT /api/inventory/branches/:branchId/set
Headers: X-Tenant-ID, Authorization
Roles: ShopOwner, TenantAdmin, BranchManager
```

**Request Body:**
```json
{
  "productId": "product-id",
  "quantity": 20,
  "minimumStock": 5,
  "maximumStock": 50
}
```

### Get Low Stock Items

```http
GET /api/inventory/branches/:branchId/low-stock
Headers: X-Tenant-ID, Authorization
Roles: All authenticated users
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "inventory-id",
      "productId": "product-id",
      "productName": "Laptop HP ProBook",
      "productSku": "LAP-HP-001",
      "unit": "piece",
      "quantity": 3,
      "minimumStock": 5,
      "difference": 2
    }
  ]
}
```

---

## Inventory Transfers

Manage stock transfers between branches.

### List All Transfers

```http
GET /api/inventory/transfers?branchId=branch-id
Headers: X-Tenant-ID, Authorization
Roles: All authenticated users
```

**Query Parameters:**
- `branchId` (optional): Filter transfers by branch (source or destination)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "transfer-id",
      "productId": "product-id",
      "productName": "Laptop HP ProBook",
      "productSku": "LAP-HP-001",
      "fromBranchId": "branch-1-id",
      "fromBranchName": "Accra Branch",
      "toBranchId": "branch-2-id",
      "toBranchName": "Kumasi Branch",
      "quantity": 5,
      "status": "pending",
      "notes": "Kumasi branch needs more stock",
      "requestedBy": "user-id",
      "approvedBy": null,
      "requestedAt": "2024-01-20T10:00:00Z",
      "approvedAt": null,
      "completedAt": null
    }
  ]
}
```

**Transfer Statuses:**
- `pending` - Awaiting approval
- `approved` - Approved, ready to complete
- `rejected` - Rejected by source branch
- `completed` - Transfer executed, inventory moved

### Get Transfer Details

```http
GET /api/inventory/transfers/:id
Headers: X-Tenant-ID, Authorization
Roles: All authenticated users
```

### Create Transfer Request

```http
POST /api/inventory/transfers
Headers: X-Tenant-ID, Authorization
Roles: ShopOwner, TenantAdmin, BranchManager, Supervisor
```

**Request Body:**
```json
{
  "productId": "product-id",
  "fromBranchId": "branch-1-id",
  "toBranchId": "branch-2-id",
  "quantity": 5,
  "notes": "Kumasi branch needs more stock"
}
```

### Approve or Reject Transfer

```http
PATCH /api/inventory/transfers/:id/approve
Headers: X-Tenant-ID, Authorization
Roles: ShopOwner, TenantAdmin, BranchManager (of source branch)
```

**Request Body:**
```json
{
  "approved": true,
  "notes": "Approved for transfer"
}
```

### Complete Transfer

Executes the inventory movement.

```http
POST /api/inventory/transfers/:id/complete
Headers: X-Tenant-ID, Authorization
Roles: ShopOwner, TenantAdmin, BranchManager
```

**Process:**
1. Deducts quantity from source branch
2. Adds quantity to destination branch
3. Marks transfer as completed

---

## Customer Management

Manage tenant-wide customer database.

### List All Customers

```http
GET /api/customers?search=john
Headers: X-Tenant-ID, Authorization
Roles: All authenticated users
```

**Query Parameters:**
- `search` (optional): Search by name, email, or phone

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "customer-id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+233-24-555-1234",
      "address": "123 Customer St, Accra",
      "dateOfBirth": "1990-01-15T00:00:00Z",
      "loyaltyPoints": 150,
      "lastPurchaseAt": "2024-01-20T14:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-20T14:30:00Z"
    }
  ]
}
```

### Get Customer Details

```http
GET /api/customers/:id
Headers: X-Tenant-ID, Authorization
Roles: All authenticated users
```

### Create Customer

```http
POST /api/customers
Headers: X-Tenant-ID, Authorization
Roles: All authenticated users
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+233-24-555-1234",
  "address": "123 Customer St, Accra",
  "dateOfBirth": "1990-01-15T00:00:00.000Z",
  "loyaltyPoints": 0
}
```

### Update Customer

```http
PUT /api/customers/:id
Headers: X-Tenant-ID, Authorization
Roles: All authenticated users
```

**Request Body:** Same as Create (all fields optional)

### Delete Customer

```http
DELETE /api/customers/:id
Headers: X-Tenant-ID, Authorization
Roles: ShopOwner, TenantAdmin, BranchManager
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `INVALID_TOKEN` | 401 | Expired or malformed JWT token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `TENANT_CONTEXT_MISSING` | 400 | Missing X-Tenant-ID header |
| `BRANCH_CONTEXT_MISSING` | 400 | Missing branch context |
| `BRANCH_NOT_FOUND` | 404 | Branch does not exist |
| `BRANCH_ACCESS_DENIED` | 403 | No access to branch |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |

---

## Rate Limiting

API requests are rate-limited to **100 requests per 15 minutes** per IP address.

When rate limit is exceeded:
```json
{
  "success": false,
  "error": {
    "message": "Too many requests, please try again later",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

---

## Pagination

Endpoints that return lists will be paginated in future updates. Currently, all results are returned.

---

## Webhooks (Future)

Webhook support for events like:
- Inventory low stock alerts
- Transfer approvals
- Customer purchases

---

## Support

For API support, please contact: support@example.com

---

**API Version:** 1.0.0
**Last Updated:** 2024-01-20
