import { Request, Response } from "express";
import { ReorderSuggestionsService } from "./reorder-suggestions.service";

const suggestionsService = new ReorderSuggestionsService();

export class ReorderSuggestionsController {
  /**
   * Generate reorder suggestions
   */
  async generateSuggestions(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { branchId } = req.params;

      const suggestions = await suggestionsService.generateSuggestions(
        tenantId,
        branchId,
      );

      res.json({
        message: `Generated ${suggestions.length} reorder suggestion(s)`,
        suggestions,
      });
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate suggestions",
      });
    }
  }

  /**
   * Get suggestions with filters
   */
  async getSuggestions(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;

      const filters = {
        branchId: req.query.branchId as string | undefined,
        productId: req.query.productId as string | undefined,
        status: req.query.status as
          | "pending"
          | "dismissed"
          | "snoozed"
          | "ordered"
          | undefined,
      };

      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 50;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string, 10)
        : 0;

      const suggestions = await suggestionsService.getSuggestions(
        tenantId,
        filters,
        limit,
        offset,
      );

      res.json(suggestions);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to get suggestions",
      });
    }
  }

  /**
   * Get suggestion by ID
   */
  async getSuggestionById(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { suggestionId } = req.params;

      const suggestion = await suggestionsService.getSuggestionById(
        tenantId,
        suggestionId,
      );

      res.json(suggestion);
    } catch (error) {
      res.status(404).json({
        error:
          error instanceof Error ? error.message : "Suggestion not found",
      });
    }
  }

  /**
   * Dismiss a suggestion
   */
  async dismissSuggestion(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { suggestionId } = req.params;
      const dismissedBy = req.userId!;
      const { notes } = req.body;

      const suggestion = await suggestionsService.dismissSuggestion(
        tenantId,
        suggestionId,
        dismissedBy,
        notes,
      );

      res.json(suggestion);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to dismiss suggestion",
      });
    }
  }

  /**
   * Snooze a suggestion
   */
  async snoozeSuggestion(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { suggestionId } = req.params;
      const snoozedBy = req.userId!;
      const { snoozeUntil, notes } = req.body;

      if (!snoozeUntil) {
        return res.status(400).json({ error: "snoozeUntil date is required" });
      }

      const suggestion = await suggestionsService.snoozeSuggestion(
        tenantId,
        suggestionId,
        snoozedBy,
        new Date(snoozeUntil),
        notes,
      );

      res.json(suggestion);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to snooze suggestion",
      });
    }
  }

  /**
   * Mark suggestion as ordered
   */
  async markAsOrdered(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { suggestionId } = req.params;
      const { purchaseId } = req.body;

      if (!purchaseId) {
        return res.status(400).json({ error: "purchaseId is required" });
      }

      const suggestion = await suggestionsService.markAsOrdered(
        tenantId,
        suggestionId,
        purchaseId,
      );

      res.json(suggestion);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to mark suggestion as ordered",
      });
    }
  }

  /**
   * Get summary by branch
   */
  async getSummaryByBranch(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { branchId } = req.params;

      const summary = await suggestionsService.getSummaryByBranch(
        tenantId,
        branchId,
      );

      res.json(summary);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Failed to get summary",
      });
    }
  }
}
