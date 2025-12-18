-- Convert "Anova Fertility and Repro Health" to a multi-location account
-- This migration:
-- 1. Finds the account by name (case-insensitive)
-- 2. Checks if it already has locations
-- 3. If it has UDF fields populated, creates a location from those fields
-- 4. If no location exists, creates a default location
-- 5. Updates account_type to 'multi_location'

DO $$
DECLARE
    anova_account_id UUID;
    existing_location_count INTEGER;
    location_id UUID;
BEGIN
    -- Find the account by name (case-insensitive, partial match)
    SELECT id INTO anova_account_id
    FROM accounts
    WHERE LOWER(name) LIKE '%anova%fertility%repro%health%'
       OR LOWER(name) LIKE '%anova fertility%'
       OR LOWER(name) = 'anova fertility and repro health'
    LIMIT 1;

    -- If account not found, try more flexible search
    IF anova_account_id IS NULL THEN
        SELECT id INTO anova_account_id
        FROM accounts
        WHERE LOWER(name) LIKE '%anova%'
        LIMIT 1;
    END IF;

    -- If still not found, exit gracefully
    IF anova_account_id IS NULL THEN
        RAISE NOTICE 'Account "Anova Fertility and Repro Health" not found. Skipping migration.';
        RETURN;
    END IF;

    RAISE NOTICE 'Found account with ID: %', anova_account_id;

    -- Check if account already has locations
    SELECT COUNT(*) INTO existing_location_count
    FROM locations
    WHERE account_id = anova_account_id;

    RAISE NOTICE 'Existing locations count: %', existing_location_count;

    -- If no locations exist, create one from UDF fields or account data
    IF existing_location_count = 0 THEN
        -- Create location from UDF fields if they exist, otherwise use account defaults
        INSERT INTO locations (
            account_id,
            name,
            address_line1,
            address_line2,
            city,
            state,
            zip_code,
            country,
            phone,
            email,
            contact_name,
            contact_title,
            is_primary,
            status,
            notes,
            clinic_code,
            sage_code
        )
        SELECT
            anova_account_id,
            COALESCE(
                a.udf_clinic_name,
                a.udf_shipto_name,
                a.name,
                'Anova Fertility and Repro Health - Main Location'
            ),
            a.udf_address_line1,
            a.udf_address_line2,
            a.udf_city,
            a.udf_state,
            a.udf_zipcode,
            COALESCE(a.udf_country_code, 'USA'),
            COALESCE(a.udf_phone, a.primary_contact_phone),
            COALESCE(a.udf_email, a.primary_contact_email),
            a.primary_contact_name,
            NULL, -- contact_title not in accounts table
            TRUE, -- Set as primary location
            'active',
            COALESCE(a.udf_notes, a.notes),
            a.udf_clinic_code,
            a.sage_code
        FROM accounts a
        WHERE a.id = anova_account_id
        RETURNING id INTO location_id;

        RAISE NOTICE 'Created location with ID: %', location_id;
    ELSE
        RAISE NOTICE 'Account already has locations. Skipping location creation.';
    END IF;

    -- Update account_type to multi_location
    UPDATE accounts
    SET account_type = 'multi_location'
    WHERE id = anova_account_id;

    RAISE NOTICE 'Updated account_type to multi_location for account ID: %', anova_account_id;

END $$;

