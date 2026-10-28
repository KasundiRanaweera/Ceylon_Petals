-- Tables added after the init migration missed the row level security lock-down it applies.
-- Same reasoning: the app never uses Supabase's REST API, so with RLS on and no policies the
-- public "anon" key can read and write nothing. The API server connects as the owner and bypasses it.
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StoredImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordReset" ENABLE ROW LEVEL SECURITY;
