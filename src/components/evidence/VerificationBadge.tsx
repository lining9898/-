import React from 'react';
import { VerificationStatus } from '../../types/evidence';

interface VerificationBadgeProps {
  status: VerificationStatus;
  className?: string;
}

const statusColors: Record<VerificationStatus, string> = {
  VERIFIED: 'bg-green-100 text-green-700',
  REVIEW_REQUIRED: 'bg-orange-100 text-orange-700',
  UNVERIFIED: 'bg-red-100 text-red-700',
};

const VerificationBadge: React.FC<VerificationBadgeProps> = ({ status, className = '' }) => (
  <span className={`px-2 py-0.5 rounded text-xs ${statusColors[status]} ${className}`}>
    {status}
  </span>
);

export default VerificationBadge;
