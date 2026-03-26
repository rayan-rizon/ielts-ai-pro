-- Fix for duplicate Cambridge tests on dashboard
-- Returns unique tests (DISTINCT ON year + test number)
-- Orders by latest year and latest test number (DESC)

CREATE OR REPLACE FUNCTION "public"."get_cambridge_tests"("p_limit" integer DEFAULT 4) RETURNS TABLE("id" "uuid", "title" "text", "test_type" "text", "cambridge_year" integer, "cambridge_test_number" integer)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    SELECT DISTINCT ON (cambridge_year, cambridge_test_number)
        id,
        title,
        test_type,
        cambridge_year,
        cambridge_test_number
    FROM public.passages
    WHERE is_official_cambridge = true AND is_active = true
    ORDER BY cambridge_year DESC, cambridge_test_number DESC, id ASC
    LIMIT p_limit;
$$;

ALTER FUNCTION "public"."get_cambridge_tests"("p_limit" integer) OWNER TO "postgres";
