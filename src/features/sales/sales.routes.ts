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

// Customers routes
router.post("/customers", authenticate, customersController.createCustomer);
router.get("/customers", authenticate, customersController.getAllCustomers);
router.get("/customers/:id", authenticate, customersController.getCustomerById);
router.put("/customers/:id", authenticate, customersController.updateCustomer);
router.delete("/customers/:id", authenticate, customersController.deleteCustomer);
router.get("/customers/walk-in/:branchId", authenticate, customersController.getWalkInCustomer);

// Sales routes
router.post("/sales/credit", authenticate, salesController.createCreditSale);
router.post("/sales/till", authenticate, salesController.createTillSale);
router.get("/sales", authenticate, salesController.getAllSales);
router.get("/sales/unpaid", authenticate, salesController.getUnpaidSales);
router.get("/sales/:id", authenticate, salesController.getSaleById);
router.put("/sales/:id", authenticate, salesController.updateSale);
router.post("/sales/:id/confirm", authenticate, salesController.confirmSale);
router.post("/sales/:id/payments", authenticate, salesController.addPayment);
router.delete("/sales/:id", authenticate, salesController.cancelSale);

// Quotations routes
router.post("/quotations", authenticate, quotationsController.createQuotation);
router.get("/quotations", authenticate, quotationsController.getAllQuotations);
router.get("/quotations/:id", authenticate, quotationsController.getQuotationById);
router.put("/quotations/:id", authenticate, quotationsController.updateQuotation);
router.post("/quotations/:id/send", authenticate, quotationsController.sendQuotation);
router.post("/quotations/:id/convert-to-sale", authenticate, quotationsController.convertToSale);
router.post("/quotations/:id/reject", authenticate, quotationsController.rejectQuotation);
router.post("/quotations/:id/recreate", authenticate, quotationsController.recreateQuotation);

// Laybys routes
router.post("/laybys", authenticate, laybysController.createLayby);
router.get("/laybys", authenticate, laybysController.getAllLaybys);
router.get("/laybys/active", authenticate, laybysController.getActiveLaybys);
router.get("/laybys/:id", authenticate, laybysController.getLaybyById);
router.put("/laybys/:id", authenticate, laybysController.updateLayby);
router.post("/laybys/:id/activate", authenticate, laybysController.activateLayby);
router.post("/laybys/:id/payments", authenticate, laybysController.addPayment);
router.post("/laybys/:id/collect", authenticate, laybysController.collectLayby);
router.post("/laybys/:id/cancel", authenticate, laybysController.cancelLayby);

// Settings routes
router.get("/settings/tenant", authenticate, settingsController.getTenantSettings);
router.put("/settings/tenant", authenticate, settingsController.updateTenantSettings);
router.get("/settings/branch/:branchId", authenticate, settingsController.getBranchSettings);
router.put("/settings/branch/:branchId", authenticate, settingsController.updateBranchSettings);

// Discounts routes
router.get("/discounts/branch/:branchId", authenticate, settingsController.getBranchDiscounts);
router.post("/discounts", authenticate, settingsController.createDiscount);
router.put("/discounts/:id", authenticate, settingsController.updateDiscount);
router.delete("/discounts/:id", authenticate, settingsController.deleteDiscount);

export default router;
