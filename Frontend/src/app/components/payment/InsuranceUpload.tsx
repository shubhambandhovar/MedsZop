import React, { useState } from 'react';
import insuranceService from '../../../services/insuranceService';

interface InsuranceUploadProps {
  onUploadSuccess: (insuranceId: string) => void;
  onUploadError: (error: string) => void;
}

const InsuranceUpload: React.FC<InsuranceUploadProps> = ({ onUploadSuccess, onUploadError }) => {
  const [provider, setProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [policyDocument, setPolicyDocument] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const providers = [
    { code: 'POLICYBAZAAR', name: 'PolicyBazaar' },
    { code: 'MEDIASSIST', name: 'MediAssist' },
    { code: 'FHPL', name: 'FHPL (Family Health Plan Limited)' },
    { code: 'STARHEALTH', name: 'Star Health Insurance' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

      if (!validTypes.includes(file.type)) {
        onUploadError('Please upload a PDF or image file (JPG, PNG)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        onUploadError('File size should be less than 5MB');
        return;
      }

      setPolicyDocument(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!provider || !policyNumber || !policyDocument) {
      onUploadError('Please fill all fields and upload policy document');
      return;
    }

    setUploading(true);

    try {
      // In a real implementation, you would first upload the file to a storage service
      // and get the URL. For now, we'll use a placeholder.
      const formData = new FormData();
      formData.append('provider', provider);
      formData.append('providerCode', provider);
      formData.append('policyNumber', policyNumber);
      formData.append('policyDocument', policyDocument);
      formData.append('policyDocumentType', policyDocument.type.startsWith('image/') ? 'image' : 'pdf');
      
      // Mock URL - replace with actual file upload service
      formData.append('policyDocumentUrl', `https://storage.medszop.com/policies/${Date.now()}_${policyDocument.name}`);

      const response = await insuranceService.uploadPolicy(formData);

      if (response.success) {
        onUploadSuccess(response.insurance._id);
      } else {
        onUploadError(response.message || 'Failed to upload insurance policy');
      }
    } catch (error: any) {
      onUploadError(error.response?.data?.message || 'Failed to upload insurance policy');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="insurance-upload bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>🛡️</span>
        Upload Insurance Policy
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Insurance Provider</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500"
            required
          >
            <option value="">Select Provider</option>
            {providers.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Policy Number */}
        <div>
          <label className="block text-sm font-medium mb-2">Policy Number</label>
          <input
            type="text"
            value={policyNumber}
            onChange={(e) => setPolicyNumber(e.target.value)}
            placeholder="Enter your policy number"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>

        {/* Document Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">Policy Document</label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              id="policy-upload"
              required
            />
            <label
              htmlFor="policy-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <span className="text-4xl">📄</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {policyDocument
                  ? policyDocument.name
                  : 'Click to upload PDF or Image (Max 5MB)'}
              </span>
            </label>
          </div>
        </div>

        {/* Info Message */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            ℹ️ Your insurance policy will be verified by our team within 24-48 hours.
            You'll be notified once approved.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload Policy'}
        </button>
      </form>
    </div>
  );
};

export default InsuranceUpload;
