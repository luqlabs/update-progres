// Master Feature List for EduForge App
// All features available in the application with their definitions

export interface FeatureDefinition {
  key: string;
  displayName: string;
  type: 'number' | 'boolean' | 'text';
  description: string;
  defaultValue: string;
  category: 'usage' | 'access' | 'branding';
  enforced: boolean; // Whether this feature is actually enforced in the app
}

export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  {
    key: 'max_apps',
    displayName: 'Maximum Apps',
    type: 'number',
    description: 'Maximum number of apps a user can create',
    defaultValue: '3',
    category: 'usage',
    enforced: true,
  },
  {
    key: 'max_monthly_plays',
    displayName: 'Monthly Plays',
    type: 'number',
    description: 'Total plays allowed per month across all apps',
    defaultValue: '100',
    category: 'usage',
    enforced: true,
  },
  {
    key: 'custom_branding',
    displayName: 'Custom Branding',
    type: 'boolean',
    description: 'Can remove "Quizabl" branding from apps',
    defaultValue: 'false',
    category: 'branding',
    enforced: true,
  },
  {
    key: 'advanced_analytics',
    displayName: 'Advanced Analytics',
    type: 'boolean',
    description: 'Access to detailed analytics and insights',
    defaultValue: 'false',
    category: 'access',
    enforced: true,
  },
  {
    key: 'credits',
    displayName: 'Credits',
    type: 'number',
    description: 'Number of AI generation credits available to the user',
    defaultValue: '100',
    category: 'usage',
    enforced: true,
  },
  {
    key: 'max_storage_mb',
    displayName: 'Storage Limit',
    type: 'number',
    description: 'Maximum storage space in MB for quiz images',
    defaultValue: '50',
    category: 'usage',
    enforced: true,
  },
];

// Helper to get feature definition by key
export const getFeatureDefinition = (key: string): FeatureDefinition | undefined => {
  return FEATURE_DEFINITIONS.find(f => f.key === key);
};

// Helper to get all enforced features
export const getEnforcedFeatures = (): FeatureDefinition[] => {
  return FEATURE_DEFINITIONS.filter(f => f.enforced);
};

// Helper to get features by category
export const getFeaturesByCategory = (category: string): FeatureDefinition[] => {
  return FEATURE_DEFINITIONS.filter(f => f.category === category);
};
