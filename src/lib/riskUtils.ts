// Common utility functions for risk level calculations and styling

// Risk level thresholds
export const RISK_THRESHOLDS = {
  HIGH: 70,
  MODERATE: 40,
  LOW: 0
} as const;

// Determine risk level based on percentage
export const getRiskLevelFromPercentage = (percentage: number): 'high' | 'moderate' | 'low' => {
  if (percentage >= RISK_THRESHOLDS.HIGH) return 'high';
  if (percentage >= RISK_THRESHOLDS.MODERATE) return 'moderate';
  return 'low';
};

// Get risk badge variant based on percentage
export const getRiskBadgeVariantFromPercentage = (percentage: number): 'riskHigh' | 'riskModerate' | 'riskLow' | 'secondary' => {
  const riskLevel = getRiskLevelFromPercentage(percentage);
  switch (riskLevel) {
    case 'high': return 'riskHigh';
    case 'moderate': return 'riskModerate';
    case 'low': return 'riskLow';
    default: return 'secondary';
  }
};

// Get risk text color class based on percentage
export const getRiskTextColorClass = (percentage: number): string => {
  const riskLevel = getRiskLevelFromPercentage(percentage);
  switch (riskLevel) {
    case 'high': return 'text-risk-high';
    case 'moderate': return 'text-risk-moderate';
    case 'low': return 'text-risk-low';
    default: return 'text-muted-foreground';
  }
};

// Legacy function for backward compatibility - determines risk badge variant from string
export const getRiskBadgeVariant = (level: string): 'riskHigh' | 'riskModerate' | 'riskLow' | 'secondary' => {
  if (!level) return 'secondary';
  
  switch (level.toLowerCase()) {
    case 'high': return 'riskHigh';
    case 'moderate': return 'riskModerate';
    case 'low': return 'riskLow';
    default: return 'secondary';
  }
};

// Get formatted risk level text with proper capitalization
export const getRiskLevelText = (percentage: number): string => {
  const riskLevel = getRiskLevelFromPercentage(percentage);
  return `${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk`;
};
