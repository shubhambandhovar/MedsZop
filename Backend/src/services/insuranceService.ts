import Insurance, { IInsurance } from '../models/Insurance';
import mongoose from 'mongoose';
import {
  UploadPolicyRequest,
  VerifyPolicyRequest,
  CheckCoverageRequest,
  PolicyUploadResponse,
  PolicyVerificationResponse,
  CoverageCheckResponse,
  DeactivationResponse,
  InsuranceServiceError,
  InsuranceErrorCode,
} from '../types/insurance.types';
import { InsuranceValidator } from '../utils/insuranceValidator';

export class InsuranceService {
  private readonly COVERAGE_PERCENTAGE = 0.3; // 30% default coverage

  constructor() {
    console.log('InsuranceService initialized');
  }

  /**
   * Upload insurance policy document
   */
  async uploadPolicy(request: UploadPolicyRequest): Promise<PolicyUploadResponse> {
    try {
      // Validate request
      InsuranceValidator.validatePolicyUpload(request);

      // Check if policy already exists
      await this.checkPolicyExists(request.policyNumber);

      // Create insurance record
      const insurance = await Insurance.create({
        userId: new mongoose.Types.ObjectId(request.userId),
        provider: request.provider,
        policyNumber: request.policyNumber,
        policyDocument: request.policyDocument,
        coverageAmount: request.coverageAmount,
        remainingCoverage: request.coverageAmount,
        usedCoverage: 0,
        verificationStatus: 'pending',
        expiryDate: request.expiryDate,
        isActive: true,
      });

      return {
        success: true,
        message: 'Policy uploaded successfully. Our team will verify it within 24-48 hours.',
        insuranceId: insurance._id.toString(),
        verificationStatus: 'pending',
      };
    } catch (error: any) {
      if (error instanceof InsuranceServiceError) {
        throw error;
      }
      console.error('Upload policy error:', error);
      throw new InsuranceServiceError(
        `Policy upload failed: ${error.message}`,
        InsuranceErrorCode.UPLOAD_FAILED,
        error
      );
    }
  }

  /**
   * Verify insurance policy (Admin/System)
   */
  async verifyPolicy(request: VerifyPolicyRequest): Promise<PolicyVerificationResponse> {
    try {
      // Validate request
      InsuranceValidator.validatePolicyVerification(request);

      const insurance = await Insurance.findById(request.insuranceId);
      if (!insurance) {
        throw new InsuranceServiceError(
          'Insurance policy not found',
          InsuranceErrorCode.POLICY_NOT_FOUND
        );
      }

      // Update verification status
      insurance.verificationStatus = request.status;
      if (request.remarks) {
        insurance.verificationRemarks = request.remarks;
      }
      insurance.verifiedAt = new Date();

      await insurance.save();

      return {
        success: true,
        message: `Policy ${request.status} successfully`,
        insuranceId: insurance._id.toString(),
        verificationStatus: request.status,
      };
    } catch (error: any) {
      if (error instanceof InsuranceServiceError) {
        throw error;
      }
      console.error('Verify policy error:', error);
      throw new InsuranceServiceError(
        `Policy verification failed: ${error.message}`,
        InsuranceErrorCode.VERIFICATION_FAILED,
        error
      );
    }
  }

  /**
   * Check coverage for items (Mock implementation)
   * In production, this would call actual insurance provider API
   */
  async checkCoverage(request: CheckCoverageRequest): Promise<CoverageCheckResponse> {
    try {
      // Validate request
      InsuranceValidator.validateCoverageCheck(request);

      const insurance = await Insurance.findById(request.insuranceId);
      if (!insurance) {
        throw new InsuranceServiceError(
          'Insurance policy not found',
          InsuranceErrorCode.POLICY_NOT_FOUND
        );
      }

      if (insurance.verificationStatus !== 'approved') {
        throw new InsuranceServiceError(
          'Insurance policy not approved',
          InsuranceErrorCode.POLICY_NOT_APPROVED
        );
      }

      // Validate policy expiry
      InsuranceValidator.validatePolicyExpiry(insurance.expiryDate);

      if (!insurance.isActive) {
        throw new InsuranceServiceError(
          'Insurance policy is inactive',
          InsuranceErrorCode.POLICY_INACTIVE
        );
      }

      // Calculate coverage for each item
      const coveredItems = request.items.map((item) =>
        this.calculateItemCoverage(item, insurance)
      );

      const totalCoverage = coveredItems.reduce((sum, item) => sum + item.coveredAmount, 0);

      // Check if enough coverage available
      if (totalCoverage > insurance.remainingCoverage) {
        throw new InsuranceServiceError(
          'Insufficient coverage remaining',
          InsuranceErrorCode.INSUFFICIENT_COVERAGE
        );
      }

      return {
        success: true,
        totalCoverage,
        coveredItems,
        remainingCoverage: insurance.remainingCoverage - totalCoverage,
        provider: insurance.provider,
        policyNumber: insurance.policyNumber,
      };
    } catch (error: any) {
      if (error instanceof InsuranceServiceError) {
        throw error;
      }
      console.error('Check coverage error:', error);
      throw new InsuranceServiceError(
        `Coverage check failed: ${error.message}`,
        InsuranceErrorCode.COVERAGE_CHECK_FAILED,
        error
      );
    }
  }

  /**
   * Get user's insurance policies
   */
  async getUserInsurance(userId: string): Promise<IInsurance[]> {
    try {
      return await Insurance.find({ userId: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error: any) {
      console.error('Get user insurance error:', error);
      throw new InsuranceServiceError(
        `Failed to fetch user insurance: ${error.message}`,
        InsuranceErrorCode.POLICY_NOT_FOUND,
        error
      );
    }
  }

  /**
   * Get insurance by ID
   */
  async getInsuranceById(insuranceId: string): Promise<IInsurance | null> {
    try {
      const insurance = await Insurance.findById(insuranceId).exec();
      if (!insurance) {
        throw new InsuranceServiceError(
          'Insurance policy not found',
          InsuranceErrorCode.POLICY_NOT_FOUND
        );
      }
      return insurance;
    } catch (error: any) {
      if (error instanceof InsuranceServiceError) {
        throw error;
      }
      console.error('Get insurance error:', error);
      throw new InsuranceServiceError(
        `Failed to fetch insurance: ${error.message}`,
        InsuranceErrorCode.POLICY_NOT_FOUND,
        error
      );
    }
  }

  /**
   * Get pending verifications (Admin)
   */
  async getPendingVerifications(limit = 50): Promise<IInsurance[]> {
    try {
      return await Insurance.find({ verificationStatus: 'pending' })
        .populate('userId', 'name email phone')
        .sort({ createdAt: 1 })
        .limit(limit)
        .exec();
    } catch (error: any) {
      console.error('Get pending verifications error:', error);
      throw new InsuranceServiceError(
        `Failed to fetch pending verifications: ${error.message}`,
        InsuranceErrorCode.POLICY_NOT_FOUND,
        error
      );
    }
  }

  /**
   * Deactivate insurance
   */
  async deactivateInsurance(insuranceId: string): Promise<DeactivationResponse> {
    try {
      const insurance = await Insurance.findById(insuranceId);
      if (!insurance) {
        throw new InsuranceServiceError(
          'Insurance policy not found',
          InsuranceErrorCode.POLICY_NOT_FOUND
        );
      }

      insurance.isActive = false;
      await insurance.save();

      return {
        success: true,
        message: 'Insurance policy deactivated successfully',
        insuranceId: insurance._id.toString(),
      };
    } catch (error: any) {
      if (error instanceof InsuranceServiceError) {
        throw error;
      }
      console.error('Insurance deactivation error:', error);
      throw new InsuranceServiceError(
        `Deactivation failed: ${error.message}`,
        InsuranceErrorCode.POLICY_INACTIVE,
        error
      );
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Check if policy already exists
   */
  private async checkPolicyExists(policyNumber: string): Promise<void> {
    const existingPolicy = await Insurance.findOne({ policyNumber });
    if (existingPolicy) {
      throw new InsuranceServiceError(
        'Policy number already exists in the system',
        InsuranceErrorCode.DUPLICATE_POLICY
      );
    }
  }

  /**
   * Calculate coverage for a single item
   */
  private calculateItemCoverage(
    item: { itemId: string; amount: number },
    insurance: IInsurance
  ): {
    itemId: string;
    originalAmount: number;
    coveredAmount: number;
    userPayableAmount: number;
  } {
    const coveredAmount = Math.min(
      item.amount * this.COVERAGE_PERCENTAGE,
      insurance.remainingCoverage
    );

    return {
      itemId: item.itemId,
      originalAmount: item.amount,
      coveredAmount,
      userPayableAmount: item.amount - coveredAmount,
    };
  }
}

// Export singleton instance
export const insuranceService = new InsuranceService();
