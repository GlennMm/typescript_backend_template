import express from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { CustomersController } from "./customers.controller";
import { SalesController } from "./sales.controller";
import { QuotationsController } from "./quotations.controller";
import { LaybysController } from "./laybys.controller";
import { SettingsController } from "./settings.controller";

const router = express.Router();

// Initialize controllers
const customersController = new CustomersController();
const salesController = new SalesController();
const quotationsController = new QuotationsController();
const laybysController = new LaybysController();
const settingsController = new SettingsController();

/**
 * @swagger
 * /api/sales/customers:
 *   post:
 *     tags: [Customers]
 *     summary: Create a new customer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Customer created successfully
 *   get:
 *     tags: [Customers]
 *     summary: Get all customers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of customers
 */
router.post("/customers", authenticate, customersController.createCustomer);
router.get("/customers", authenticate, customersController.getAllCustomers);

/**
 * @swagger
 * /api/sales/customers/{id}:
 *   get:
 *     tags: [Customers]
 *     summary: Get customer by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer details
 *   put:
 *     tags: [Customers]
 *     summary: Update customer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer updated
 *   delete:
 *     tags: [Customers]
 *     summary: Delete customer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer deleted
 */
router.get("/customers/:id", authenticate, customersController.getCustomerById);
router.put("/customers/:id", authenticate, customersController.updateCustomer);
router.delete("/customers/:id", authenticate, customersController.deleteCustomer);

/**
 * @swagger
 * /api/sales/customers/walk-in/{branchId}:
 *   get:
 *     tags: [Customers]
 *     summary: Get or create walk-in customer for branch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Walk-in customer
 */
router.get("/customers/walk-in/:branchId", authenticate, customersController.getWalkInCustomer);

/**
 * @swagger
 * /api/sales/sales/credit:
 *   post:
 *     tags: [Sales]
 *     summary: Create credit sale (draft)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Credit sale created
 */
router.post("/sales/credit", authenticate, salesController.createCreditSale);

/**
 * @swagger
 * /api/sales/sales/till:
 *   post:
 *     tags: [Sales]
 *     summary: Create till sale (immediate, completed)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Till sale completed
 */
router.post("/sales/till", authenticate, salesController.createTillSale);

/**
 * @swagger
 * /api/sales/sales:
 *   get:
 *     tags: [Sales]
 *     summary: Get all sales with filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: saleType
 *         schema:
 *           type: string
 *           enum: [credit, till]
 *     responses:
 *       200:
 *         description: List of sales
 */
router.get("/sales", authenticate, salesController.getAllSales);

/**
 * @swagger
 * /api/sales/sales/unpaid:
 *   get:
 *     tags: [Sales]
 *     summary: Get unpaid sales
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of unpaid sales
 */
router.get("/sales/unpaid", authenticate, salesController.getUnpaidSales);

/**
 * @swagger
 * /api/sales/sales/{id}:
 *   get:
 *     tags: [Sales]
 *     summary: Get sale by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sale details
 *   put:
 *     tags: [Sales]
 *     summary: Update sale (draft only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sale updated
 *   delete:
 *     tags: [Sales]
 *     summary: Cancel sale (draft only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sale cancelled
 */
router.get("/sales/:id", authenticate, salesController.getSaleById);
router.put("/sales/:id", authenticate, salesController.updateSale);
router.delete("/sales/:id", authenticate, salesController.cancelSale);

/**
 * @swagger
 * /api/sales/sales/{id}/confirm:
 *   post:
 *     tags: [Sales]
 *     summary: Confirm sale and deduct stock
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sale confirmed
 */
router.post("/sales/:id/confirm", authenticate, salesController.confirmSale);

/**
 * @swagger
 * /api/sales/sales/{id}/payments:
 *   post:
 *     tags: [Sales]
 *     summary: Add payment to sale
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment added
 */
router.post("/sales/:id/payments", authenticate, salesController.addPayment);

/**
 * @swagger
 * /api/sales/quotations:
 *   post:
 *     tags: [Quotations]
 *     summary: Create quotation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Quotation created
 *   get:
 *     tags: [Quotations]
 *     summary: Get all quotations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of quotations
 */
router.post("/quotations", authenticate, quotationsController.createQuotation);
router.get("/quotations", authenticate, quotationsController.getAllQuotations);

/**
 * @swagger
 * /api/sales/quotations/{id}:
 *   get:
 *     tags: [Quotations]
 *     summary: Get quotation by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quotation details
 *   put:
 *     tags: [Quotations]
 *     summary: Update quotation (draft only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quotation updated
 */
router.get("/quotations/:id", authenticate, quotationsController.getQuotationById);
router.put("/quotations/:id", authenticate, quotationsController.updateQuotation);

/**
 * @swagger
 * /api/sales/quotations/{id}/send:
 *   post:
 *     tags: [Quotations]
 *     summary: Send quotation to customer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quotation sent
 */
router.post("/quotations/:id/send", authenticate, quotationsController.sendQuotation);

/**
 * @swagger
 * /api/sales/quotations/{id}/convert-to-sale:
 *   post:
 *     tags: [Quotations]
 *     summary: Convert quotation to credit sale
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quotation converted to sale
 */
router.post("/quotations/:id/convert-to-sale", authenticate, quotationsController.convertToSale);

/**
 * @swagger
 * /api/sales/quotations/{id}/reject:
 *   post:
 *     tags: [Quotations]
 *     summary: Reject quotation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quotation rejected
 */
router.post("/quotations/:id/reject", authenticate, quotationsController.rejectQuotation);

/**
 * @swagger
 * /api/sales/quotations/{id}/recreate:
 *   post:
 *     tags: [Quotations]
 *     summary: Recreate expired quotation with updated prices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: New quotation created
 */
router.post("/quotations/:id/recreate", authenticate, quotationsController.recreateQuotation);

/**
 * @swagger
 * /api/sales/laybys:
 *   post:
 *     tags: [Laybys]
 *     summary: Create layby
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Layby created
 *   get:
 *     tags: [Laybys]
 *     summary: Get all laybys
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of laybys
 */
router.post("/laybys", authenticate, laybysController.createLayby);
router.get("/laybys", authenticate, laybysController.getAllLaybys);

/**
 * @swagger
 * /api/sales/laybys/active:
 *   get:
 *     tags: [Laybys]
 *     summary: Get active laybys
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active laybys
 */
router.get("/laybys/active", authenticate, laybysController.getActiveLaybys);

/**
 * @swagger
 * /api/sales/laybys/{id}:
 *   get:
 *     tags: [Laybys]
 *     summary: Get layby by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Layby details
 *   put:
 *     tags: [Laybys]
 *     summary: Update layby (before first payment)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Layby updated
 */
router.get("/laybys/:id", authenticate, laybysController.getLaybyById);
router.put("/laybys/:id", authenticate, laybysController.updateLayby);

/**
 * @swagger
 * /api/sales/laybys/{id}/activate:
 *   post:
 *     tags: [Laybys]
 *     summary: Activate layby and reserve stock
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Layby activated
 */
router.post("/laybys/:id/activate", authenticate, laybysController.activateLayby);

/**
 * @swagger
 * /api/sales/laybys/{id}/payments:
 *   post:
 *     tags: [Laybys]
 *     summary: Add payment to layby
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment added
 */
router.post("/laybys/:id/payments", authenticate, laybysController.addPayment);

/**
 * @swagger
 * /api/sales/laybys/{id}/collect:
 *   post:
 *     tags: [Laybys]
 *     summary: Mark layby as collected
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Layby collected
 */
router.post("/laybys/:id/collect", authenticate, laybysController.collectLayby);

/**
 * @swagger
 * /api/sales/laybys/{id}/cancel:
 *   post:
 *     tags: [Laybys]
 *     summary: Cancel layby with refund
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Layby cancelled
 */
router.post("/laybys/:id/cancel", authenticate, laybysController.cancelLayby);

/**
 * @swagger
 * /api/sales/settings/tenant:
 *   get:
 *     tags: [Sales Settings]
 *     summary: Get tenant sales settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tenant settings
 *   put:
 *     tags: [Sales Settings]
 *     summary: Update tenant sales settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.get("/settings/tenant", authenticate, settingsController.getTenantSettings);
router.put("/settings/tenant", authenticate, settingsController.updateTenantSettings);

/**
 * @swagger
 * /api/sales/settings/branch/{branchId}:
 *   get:
 *     tags: [Sales Settings]
 *     summary: Get branch sales settings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Branch settings
 *   put:
 *     tags: [Sales Settings]
 *     summary: Update branch sales settings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.get("/settings/branch/:branchId", authenticate, settingsController.getBranchSettings);
router.put("/settings/branch/:branchId", authenticate, settingsController.updateBranchSettings);

/**
 * @swagger
 * /api/sales/discounts/branch/{branchId}:
 *   get:
 *     tags: [Sales Settings]
 *     summary: Get branch discounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of discounts
 */
router.get("/discounts/branch/:branchId", authenticate, settingsController.getBranchDiscounts);

/**
 * @swagger
 * /api/sales/discounts:
 *   post:
 *     tags: [Sales Settings]
 *     summary: Create branch discount
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Discount created
 */
router.post("/discounts", authenticate, settingsController.createDiscount);

/**
 * @swagger
 * /api/sales/discounts/{id}:
 *   put:
 *     tags: [Sales Settings]
 *     summary: Update discount
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Discount updated
 *   delete:
 *     tags: [Sales Settings]
 *     summary: Delete discount
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Discount deleted
 */
router.put("/discounts/:id", authenticate, settingsController.updateDiscount);
router.delete("/discounts/:id", authenticate, settingsController.deleteDiscount);

export default router;
