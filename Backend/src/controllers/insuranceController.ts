import { Request, Response } from 'express';
import { InsuranceService } from '../services/insuranceService';

export class InsuranceController {
  /**
   * Upload insurance policy
   * POST /api/insurance/upload
   */
  static async uploadPolicy(req: Request, res: Response) {
    try {
      const { provider, providerCode, policyNumber, policyDocumentUrl, policyDocumentType } =
        req.body;
      const userId = (req as any).user.id;

      if (!provider || !providerCode || !policyNumber || !policyDocumentUrl) {
        return res.status(400).json({
          success: false,
          message: 'All policy details are required',
        });
      }

      const result = await InsuranceService.uploadPolicy({
        userId,
        provider,
        providerCode,
        policyNumber,
        policyDocumentUrl,
        policyDocumentType: policyDocumentType || 'pdf',
      });

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Upload policy error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Policy upload failed',
      });
    }
  }

  /**
   * Verify insurance policy (Admin only)
   * POST /api/insurance/verify/:insuranceId
   */
  static async verifyPolicy(req: Request, res: Response) {
    try {
      const { insuranceId } = req.params;
      const { approved, rejectionReason, totalCoverageLimit, policyStartDate, policyEndDate } =
        req.body;
      const verifiedBy = (req as any).user.id;

      const result = await InsuranceService.verifyPolicy({
        insuranceId,
        verifiedBy,
        approved,
        rejectionReason,
        totalCoverageLimit,
        policyStartDate,
        policyEndDate,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Verify policy error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Policy verification failed',
      });
    }
  }

  /**
   * Check coverage for items
   * POST /api/insurance/check-coverage/:insuranceId
   */
  static async checkCoverage(req: Request, res: Response) {
    try {
      const { insuranceId } = req.params;
      const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Items array is required',
        });
      }

      const result = await InsuranceService.checkCoverage({
        insuranceId,
        items,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Check coverage error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Coverage check failed',
      });
    }
  }

  /**
   * Get user's insurance policies
   * GET /api/insurance/user
   */
  static async getUserInsurance(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const insurances = await InsuranceService.getUserInsurance(userId);

      return res.status(200).json({
        success: true,
        insurances,
      });
    } catch (error: any) {
      console.error('Get user insurance error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch insurance',
      });
    }
  }

  /**
   * Get insurance by ID
   * GET /api/insurance/:insuranceId
   */
  static async getInsuranceById(req: Request, res: Response) {
    try {
      const { insuranceId } = req.params;
      const insurance = await InsuranceService.getInsuranceById(insuranceId);

      if (!insurance) {
        return res.status(404).json({
          success: false,
          message: 'Insurance not found',
        });
      }

      return res.status(200).json({
        success: true,
        insurance,
      });
    } catch (error: any) {
      console.error('Get insurance error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch insurance',
      });
    }
  }

  /**
   * Get pending verifications (Admin only)
   * GET /api/insurance/pending
   */
  static async getPendingVerifications(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const insurances = await InsuranceService.getPendingVerifications(limit);

      return res.status(200).json({
        success: true,
        insurances,
        count: insurances.length,
      });
    } catch (error: any) {
      console.error('Get pending verifications error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch pending verifications',
      });
    }
  }

  /**
   * Deactivate insurance
   * PUT /api/insurance/deactivate/:insuranceId
   */
  static async deactivateInsurance(req: Request, res: Response) {
    try {
      const { insuranceId } = req.params;
      const result = await InsuranceService.deactivateInsurance(insuranceId);

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Deactivate insurance error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to deactivate insurance',
      });
    }
  }
}
