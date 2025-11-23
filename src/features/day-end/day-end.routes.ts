import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { TillsController } from "./tills.controller";
import { ShiftsController } from "./shifts.controller";
import { DayEndController } from "./day-end.controller";

const router = Router();

const tillsController = new TillsController();
const shiftsController = new ShiftsController();
const dayEndController = new DayEndController();

// ============================================
// TILLS ROUTES
// ============================================

/**
 * @swagger
 * /api/day-end/tills:
 *   post:
 *     tags: [Tills]
 *     summary: Create a new till
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Till created
 */
router.post("/tills", authenticate, tillsController.createTill);

/**
 * @swagger
 * /api/day-end/tills/{tillId}:
 *   get:
 *     tags: [Tills]
 *     summary: Get till by ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Till details
 */
router.get("/tills/:tillId", authenticate, tillsController.getTillById);

/**
 * @swagger
 * /api/day-end/tills/{tillId}:
 *   put:
 *     tags: [Tills]
 *     summary: Update a till
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Till updated
 */
router.put("/tills/:tillId", authenticate, tillsController.updateTill);

/**
 * @swagger
 * /api/day-end/tills/{tillId}:
 *   delete:
 *     tags: [Tills]
 *     summary: Delete a till (soft delete)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Till deleted
 */
router.delete("/tills/:tillId", authenticate, tillsController.deleteTill);

/**
 * @swagger
 * /api/day-end/tills/{tillId}/device:
 *   post:
 *     tags: [Tills]
 *     summary: Register device to a till
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Device registered
 */
router.post(
  "/tills/:tillId/device",
  authenticate,
  tillsController.registerDevice,
);

/**
 * @swagger
 * /api/day-end/tills/{tillId}/device:
 *   delete:
 *     tags: [Tills]
 *     summary: Unregister device from a till
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Device unregistered
 */
router.delete(
  "/tills/:tillId/device",
  authenticate,
  tillsController.unregisterDevice,
);

/**
 * @swagger
 * /api/day-end/tills/device/{deviceId}:
 *   get:
 *     tags: [Tills]
 *     summary: Get till by device ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Till details
 */
router.get(
  "/tills/device/:deviceId",
  authenticate,
  tillsController.getTillByDeviceId,
);

/**
 * @swagger
 * /api/day-end/branches/{branchId}/tills:
 *   get:
 *     tags: [Tills]
 *     summary: Get all tills for a branch
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tills
 */
router.get(
  "/branches/:branchId/tills",
  authenticate,
  tillsController.getTillsByBranch,
);

/**
 * @swagger
 * /api/day-end/branches/{branchId}/tills/active:
 *   get:
 *     tags: [Tills]
 *     summary: Get active tills for a branch
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active tills
 */
router.get(
  "/branches/:branchId/tills/active",
  authenticate,
  tillsController.getActiveTillsByBranch,
);

// ============================================
// SHIFTS ROUTES
// ============================================

/**
 * @swagger
 * /api/day-end/shifts/open:
 *   post:
 *     tags: [Shifts]
 *     summary: Open a new shift
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Shift opened
 */
router.post("/shifts/open", authenticate, shiftsController.openShift);

/**
 * @swagger
 * /api/day-end/shifts/current:
 *   get:
 *     tags: [Shifts]
 *     summary: Get current open shift for logged-in cashier
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current shift details
 */
router.get("/shifts/current", authenticate, shiftsController.getCurrentShift);

/**
 * @swagger
 * /api/day-end/shifts/{shiftId}:
 *   get:
 *     tags: [Shifts]
 *     summary: Get shift by ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shift details
 */
router.get("/shifts/:shiftId", authenticate, shiftsController.getShiftById);

/**
 * @swagger
 * /api/day-end/shifts/{shiftId}/close:
 *   post:
 *     tags: [Shifts]
 *     summary: Close a shift
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shift closed
 */
router.post("/shifts/:shiftId/close", authenticate, shiftsController.closeShift);

/**
 * @swagger
 * /api/day-end/shifts/{shiftId}/cash-movements:
 *   post:
 *     tags: [Shifts]
 *     summary: Add cash movement to shift (requires supervisor approval)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Cash movement added
 */
router.post(
  "/shifts/:shiftId/cash-movements",
  authenticate,
  shiftsController.addCashMovement,
);

/**
 * @swagger
 * /api/day-end/shifts/{shiftId}/cash-movements:
 *   get:
 *     tags: [Shifts]
 *     summary: Get all cash movements for a shift
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of cash movements
 */
router.get(
  "/shifts/:shiftId/cash-movements",
  authenticate,
  shiftsController.getCashMovementsByShift,
);

/**
 * @swagger
 * /api/day-end/shifts/{shiftId}/cash-movements/pending:
 *   get:
 *     tags: [Shifts]
 *     summary: Get pending cash movements for a shift
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending cash movements
 */
router.get(
  "/shifts/:shiftId/cash-movements/pending",
  authenticate,
  shiftsController.getPendingCashMovements,
);

/**
 * @swagger
 * /api/day-end/cash-movements/{movementId}/approve:
 *   post:
 *     tags: [Shifts]
 *     summary: Approve cash movement (Manager/Supervisor only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cash movement approved
 */
router.post(
  "/cash-movements/:movementId/approve",
  authenticate,
  shiftsController.approveCashMovement,
);

/**
 * @swagger
 * /api/day-end/branches/{branchId}/shifts:
 *   get:
 *     tags: [Shifts]
 *     summary: Get shifts by branch
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of shifts
 */
router.get(
  "/branches/:branchId/shifts",
  authenticate,
  shiftsController.getShiftsByBranch,
);

/**
 * @swagger
 * /api/day-end/cashiers/{cashierId}/shifts:
 *   get:
 *     tags: [Shifts]
 *     summary: Get shifts by cashier
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of shifts
 */
router.get(
  "/cashiers/:cashierId/shifts",
  authenticate,
  shiftsController.getShiftsByCashier,
);

// ============================================
// DAY END ROUTES
// ============================================

/**
 * @swagger
 * /api/day-end/day-ends/{dayEndId}:
 *   get:
 *     tags: [Day End]
 *     summary: Get day end by ID with full summary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Day end summary with sales breakdown and payment reconciliation
 */
router.get("/day-ends/:dayEndId", authenticate, dayEndController.getDayEndById);

/**
 * @swagger
 * /api/day-end/branches/{branchId}/day-ends:
 *   get:
 *     tags: [Day End]
 *     summary: Get day ends by branch
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of day ends
 */
router.get(
  "/branches/:branchId/day-ends",
  authenticate,
  dayEndController.getDayEndsByBranch,
);

/**
 * @swagger
 * /api/day-end/day-ends/{dayEndId}/reconciliation:
 *   put:
 *     tags: [Day End]
 *     summary: Update payment reconciliation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment reconciliation updated
 */
router.put(
  "/day-ends/:dayEndId/reconciliation",
  authenticate,
  dayEndController.updatePaymentReconciliation,
);

/**
 * @swagger
 * /api/day-end/day-ends/{dayEndId}/review:
 *   post:
 *     tags: [Day End]
 *     summary: Review day end (Manager/Supervisor)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Day end reviewed
 */
router.post(
  "/day-ends/:dayEndId/review",
  authenticate,
  dayEndController.reviewDayEnd,
);

/**
 * @swagger
 * /api/day-end/day-ends/{dayEndId}/approve:
 *   post:
 *     tags: [Day End]
 *     summary: Approve day end (Manager only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Day end approved (24hr edit window set)
 */
router.post(
  "/day-ends/:dayEndId/approve",
  authenticate,
  dayEndController.approveDayEnd,
);

/**
 * @swagger
 * /api/day-end/day-ends/{dayEndId}/reopen:
 *   post:
 *     tags: [Day End]
 *     summary: Reopen day end (only within 24 hours)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Day end reopened
 */
router.post(
  "/day-ends/:dayEndId/reopen",
  authenticate,
  dayEndController.reopenDayEnd,
);

export default router;
