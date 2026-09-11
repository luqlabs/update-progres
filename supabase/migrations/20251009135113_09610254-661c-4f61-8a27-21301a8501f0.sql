-- Remove obsolete features from plan_features table
DELETE FROM plan_features 
WHERE feature_key IN ('custom_themes', 'priority_support', 'api_access', 'export_data', 'max_ai_generations');