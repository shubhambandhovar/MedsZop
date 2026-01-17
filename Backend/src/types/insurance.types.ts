/**
 * Insurance Service Type Definitions
 * Clean interfaces for insurance operations
 */

import { IInsurance, ICoveredItem } from '../models/Insurance';

// Request Types
export interface UploadPolicyRequest {
  userId: string;
  provider: string;
  providerCode: InsuranceProviderCode;
  policyNumber: string;
  policyDocumentUrl: string;
  policyDocumentType: 'pdf' | 'image';
  totalCoverageLimit?: number;
  policyStartDate?: Date;
  policyEndDate?: Date;
}

export interface VerifyPolicyRequest {
  insuranceId: string;
  verifiedBy: string;
  status: 'approved' | 'rejected';
  remarks?: string;
  totalCoverageLimit?: number;
  policyStartDate?: Date;
  policyEndDate?: Date;
}

export interface CheckCoverageRequest {
  insuranceId: string;
  items: CoverageItem[];
}

export interface CoverageItem {
  itemId: string;
  itemType: 'medicine' | 'lab';
  itemName: string;
  price: number;
}

// Response Types
export interface PolicyUploadResponse {
  success: boolean;
  insurance: IInsurance;
  message: string;
}

export interface PolicyVerificationResponse {
  success: boolean;
  insurance: IInsurance;
  message: string;
}

export interface CoverageCheckResponse {
  success: boolean;
  coveredItems: any[];
  totalCoverage: number;
  remainingCoverage: number;
  provider: string;
  policyNumber: string;
}

export interface DeactivationResponse {
  success: boolean;
  message: string;
  insuranceId: string;
}

// Enums
export enum InsuranceProviderCode {
  POLICYBAZAAR = 'POLICYBAZAAR',
  MEDIASSIST = 'MEDIASSIST',
  FHPL = 'FHPL',
  STARHEALTH = 'STARHEALTH',
}

export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

// Error Types
export class InsuranceServiceError extends Error {
  constructor(
    message: string,
    public code: InsuranceErrorCode,
    public details?: any
  ) {
    super(message);
    this.name = 'InsuranceServiceError';
  }
}

export enum InsuranceErrorCode {
  POLICY_ALREADY_EXISTS = 'POLICY_ALREADY_EXISTS',
  POLICY_NOT_FOUND = 'POLICY_NOT_FOUND',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  NOT_APPROVED = 'NOT_APPROVED',
  COVERAGE_EXHAUSTED = 'COVERAGE_EXHAUSTED',
  INVALID_PROVIDER = 'INVALID_PROVIDER',
  INVALID_DOCUMENT = 'INVALID_DOCUMENT',
  POLICY_EXPIRED = 'POLICY_EXPIRED',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  POLICY_NOT_APPROVED = 'POLICY_NOT_APPROVED',
  POLICY_INACTIVE = 'POLICY_INACTIVE',
  INSUFFICIENT_COVERAGE = 'INSUFFICIENT_COVERAGE',
  COVERAGE_CHECK_FAILED = 'COVERAGE_CHECK_FAILED',
  DUPLICATE_POLICY = 'DUPLICATE_POLICY',
}

// Validation Rules
export interface PolicyValidationRules {
  maxFileSize: number; // in bytes
  allowedFileTypes: string[];
  minCoverageLimit: number;
  maxCoverageLimit: number;
}

// Coverage Configuration
export interface CoverageConfig {
  medicinesCoveragePercentage: number;
  labTestsCoveragePercentage: number;
  minCoPayPercentage: number;
  maxClaimAmount: number;
}
