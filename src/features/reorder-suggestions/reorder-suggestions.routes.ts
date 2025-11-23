import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { ReorderSuggestionsController } from "./reorder-suggestions.controller";

const router = Router();

const suggestionsController = new ReorderSuggestionsController();

// ============================================
// REORDER SUGGESTIONS ROUTES
// ============================================

/**
 * @swagger
 * /api/reorder-suggestions/branches/{branchId}/generate:
 *   post:
 *     tags: [Reorder Suggestions]
 *     summary: Generate reorder suggestions for products below minimum stock
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
 *         description: Suggestions generated
 */
router.post(
  "/branches/:branchId/generate",
  authenticate,
  suggestionsController.generateSuggestions,
);

/**
 * @swagger
 * /api/reorder-suggestions/list:
 *   get:
 *     tags: [Reorder Suggestions]
 *     summary: Get reorder suggestions with filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, dismissed, snoozed, ordered]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of suggestions
 */
router.get("/list", authenticate, suggestionsController.getSuggestions);

/**
 * @swagger
 * /api/reorder-suggestions/{suggestionId}:
 *   get:
 *     tags: [Reorder Suggestions]
 *     summary: Get suggestion by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: suggestionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Suggestion details
 */
router.get(
  "/:suggestionId",
  authenticate,
  suggestionsController.getSuggestionById,
);

/**
 * @swagger
 * /api/reorder-suggestions/{suggestionId}/dismiss:
 *   post:
 *     tags: [Reorder Suggestions]
 *     summary: Dismiss a reorder suggestion
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: suggestionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Suggestion dismissed
 */
router.post(
  "/:suggestionId/dismiss",
  authenticate,
  suggestionsController.dismissSuggestion,
);

/**
 * @swagger
 * /api/reorder-suggestions/{suggestionId}/snooze:
 *   post:
 *     tags: [Reorder Suggestions]
 *     summary: Snooze a reorder suggestion until a specific date
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: suggestionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - snoozeUntil
 *             properties:
 *               snoozeUntil:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Suggestion snoozed
 */
router.post(
  "/:suggestionId/snooze",
  authenticate,
  suggestionsController.snoozeSuggestion,
);

/**
 * @swagger
 * /api/reorder-suggestions/{suggestionId}/mark-ordered:
 *   post:
 *     tags: [Reorder Suggestions]
 *     summary: Mark suggestion as ordered (link to purchase order)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: suggestionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - purchaseId
 *             properties:
 *               purchaseId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Suggestion marked as ordered
 */
router.post(
  "/:suggestionId/mark-ordered",
  authenticate,
  suggestionsController.markAsOrdered,
);

/**
 * @swagger
 * /api/reorder-suggestions/branches/{branchId}/summary:
 *   get:
 *     tags: [Reorder Suggestions]
 *     summary: Get summary of pending suggestions for a branch
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
 *         description: Summary of pending suggestions
 */
router.get(
  "/branches/:branchId/summary",
  authenticate,
  suggestionsController.getSummaryByBranch,
);

export default router;
