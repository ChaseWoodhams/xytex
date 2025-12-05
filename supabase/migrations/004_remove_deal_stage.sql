-- Remove deal_stage column from corporate_accounts table
ALTER TABLE corporate_accounts DROP COLUMN IF EXISTS deal_stage;

-- Note: We're keeping the deal_stage_enum type in case it's used elsewhere
-- If you want to remove it completely, uncomment the line below:
-- DROP TYPE IF EXISTS deal_stage_enum;

