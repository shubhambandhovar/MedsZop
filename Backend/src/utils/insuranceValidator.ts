/**
 * Insurance Validation Utilities
 */

import {
  UploadPolicyRequest,
  VerifyPolicyRequest,
  CheckCoverageRequest,
  InsuranceServiceError,
  InsuranceErrorCode,
  InsuranceProviderCode,
} from '../types/insurance.types';

export class InsuranceValidator {
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_FILE_TYPES = ['pdf', 'image', 'jpg', 'jpeg', 'png'];
  private static readonly MIN_COVERAGE_LIMIT = 10000; // ₹10,000
  private static readonly MAX_COVERAGE_LIMIT = 1000000; // ₹10 lakhs

  /**
   * Validate policy upload request
   */
  static validatePolicyUpload(request: UploadPolicyRequest): void {
    // Validate user ID
    if (!request.userId || typeof request.userId !== 'string') {
      throw new InsuranceServiceError(
        'User ID is required',
        InsuranceErrorCode.INVALID_DOCUMENT
      );
    }

    // Validate provider
    if (!request.provider || typeof request.provider !== 'string') {
      throw new InsuranceServiceError(
        'Provider is required',
        InsuranceErrorCode.INVALID_PROVIDER
      );
    }

    // Validate provider code
    const validProviderCodes = Object.values(InsuranceProviderCode);
    if (!validProviderCodes.includes(request.providerCode as InsuranceProviderCode)) {
      throw new InsuranceServiceError(
        `Provider code must be one of: ${validProviderCodes.join(', ')}`,
        InsuranceErrorCode.INVALID_PROVIDER
      );
    }

    // Validate policy number
    if (!request.policyNumber || typeof request.policyNumber !== 'string') {
      throw new InsuranceServiceError(
        'Policy number is required',
        InsuranceErrorCode.INVALID_DOCUMENT
      );
    }

    if (request.policyNumber.length < 5 || request.policyNumber.length > 50) {
      throw new InsuranceServiceError(
        'Policy number must be between 5 and 50 characters',
        InsuranceErrorCode.INVALID_DOCUMENT
      );
    }

    // Validate document URL
    if (!request.policyDocumentUrl || typeof request.policyDocumentUrl !== 'string') {
      throw new InsuranceServiceError(
        'Policy document URL is required',
        InsuranceErrorCode.INVALID_DOCUMENT
      );
    }

    // Validate document type
    if (!this.ALLOWED_FILE_TYPES.includes(request.policyDocumentType)) {
      throw new InsuranceServiceError(
        `Document type must be one of: ${this.ALLOWED_FILE_TYPES.join(', ')}`,
        InsuranceErrorCode.INVALID_DOCUMENT
      );
    }
  }

  /**
   * Validate policy verification request
   */
  static validatePolicyVerification(request: VerifyPolicyRequest): void {
    // Validate insurance ID
    if (!request.insuranceId || typeof request.insuranceId !== 'string') {
      throw new InsuranceServiceError(
        'Insurance ID is required',
        InsuranceErrorCode.POLICY_NOT_FOUND
      );
    }

    // Validate verifier ID
    if (!request.verifiedBy || typeof request.verifiedBy !== 'string') {
      throw new InsuranceServiceError(
        'Verifier ID is required',
        InsuranceErrorCode.VERIFICATION_FAILED
      );
    }

    // Validate status
    if (!request.status || !['approved', 'rejected'].includes(request.status)) {
      throw new InsuranceServiceError(
        'Valid status (approved/rejected) is required',
        InsuranceErrorCode.VERIFICATION_FAILED
      );
    }

    // If rejected, rejection reason is required
    if (request.status === 'rejected' && !request.remarks) {
      throw new InsuranceServiceError(
        'Rejection reason is required when rejecting a policy',
        InsuranceErrorCode.VERIFICATION_FAILED
      );
    }

    // If approved, validate coverage limit
    if (request.status === 'approved' && request.totalCoverageLimit) {
      if (
        request.totalCoverageLimit < this.MIN_COVERAGE_LIMIT ||
        request.totalCoverageLimit > this.MAX_COVERAGE_LIMIT
      ) {
        throw new InsuranceServiceError(
          `Coverage limit must be between ₹${this.MIN_COVERAGE_LIMIT} and ₹${this.MAX_COVERAGE_LIMIT}`,
          InsuranceErrorCode.VERIFICATION_FAILED
        );
      }
    }
  }

  /**
   * Validate coverage check request
   */
  static validateCoverageCheck(request: CheckCoverageRequest): void {
    // Validate insurance ID
    if (!request.insuranceId || typeof request.insuranceId !== 'string') {
      throw new InsuranceServiceError(
        'Insurance ID is required',
        InsuranceErrorCode.POLICY_NOT_FOUND
      );
    }

    // Validate items array
    if (!Array.isArray(request.items) || request.items.length === 0) {
      throw new InsuranceServiceError(
        'Items array is required and must not be empty',
        InsuranceErrorCode.COVERAGE_EXHAUSTED
      );
    }

    // Validate each item
    for (const item of request.items) {
      if (!item.itemId || !item.itemName || !item.itemType || typeof item.price !== 'number') {
        throw new InsuranceServiceError(
          'Each item must have itemId, itemName, itemType, and price',
          InsuranceErrorCode.COVERAGE_EXHAUSTED
        );
      }

      if (item.price <= 0) {
        throw new InsuranceServiceError(
          'Item price must be greater than 0',
          InsuranceErrorCode.COVERAGE_EXHAUSTED
        );
      }

      if (!['medicine', 'lab'].includes(item.itemType)) {
        throw new InsuranceServiceError(
          'Item type must be either "medicine" or "lab"',
          InsuranceErrorCode.COVERAGE_EXHAUSTED
        );
      }
    }
  }

  /**
   * Validate policy expiry
   */
  static validatePolicyExpiry(policyEndDate: Date | undefined): void {
    if (policyEndDate && new Date(policyEndDate) < new Date()) {
      throw new InsuranceServiceError(
        'Policy has expired',
        InsuranceErrorCode.POLICY_EXPIRED
      );
    }
  }
}
