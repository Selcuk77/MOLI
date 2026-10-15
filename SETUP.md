# MOLİ account activation

The screens and serverless API are implemented. Real signup stays disabled until the MOLİ Supabase project is connected. Do not point this at Sofranly's database.

1. Create or select a dedicated Supabase project for MOLİ.
2. Run `supabase/001_accounts.sql` in its SQL editor. It creates account profiles and owner-only row-level security. Account role and teacher verification status cannot be changed by the user. Selecting teacher never grants student access.
3. Enable Email provider and **Confirm email**. Set the minimum password length to at least 10. Enable provider rate limits and configure CAPTCHA before unrestricted public enrollment; this pilot does not yet integrate a CAPTCHA challenge.
4. Auth URL configuration:
   - Site URL: `https://moli-orcin.vercel.app`
   - Allowed redirect URLs: `https://moli-orcin.vercel.app/?flow=confirm` and `https://moli-orcin.vercel.app/?flow=recovery`.
5. In Vercel MOLİ project environment variables, add `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (or legacy `SUPABASE_ANON_KEY`), and `SITE_URL=https://moli-orcin.vercel.app`. Never add the service_role key. Redeploy after changing environment variables.
6. Configure Supabase custom SMTP using the user's Resend account and a verified sender domain before inviting users. Default Supabase SMTP has recipient restrictions and low limits; do not assume email delivery to general users. Keep SMTP credentials in Supabase settings, not GitHub or chat.
7. Use the Supabase email ConfirmationURL template defaults for PKCE same-browser links, or configure token-hash links for cross-device confirmation:
   - Signup: `{{ .SiteURL }}/?token_hash={{ .TokenHash }}&type=email`
   - Recovery: `{{ .SiteURL }}/?token_hash={{ .TokenHash }}&type=recovery`
   Keep these token-bearing links private. Callback params are removed from browser history before processing.
8. Verify in a disposable test account: guardian/student signup → email confirmation → login → own account edit → logout → password recovery → new password → login. Repeat teacher signup and confirm its status remains pending and no student data is visible. No real account or email was created during automated code tests.

## Important behavior

- Auth sessions use the official Supabase SSR package with HttpOnly, same-site cookies and Secure in production. The server verifies identity with getUser rather than trusting localStorage or an unverified cookie.
- POST endpoints enforce same-origin JSON requests. Supabase handles password hashing, token refresh, and provider rate limits. Cookie-auth responses are never cached.
- Only selected static files are published from `public/`. Server code, SQL, and environment templates are outside the output folder.
- Student accounts use the guardian's email and a student's display name. The guardian checkbox records an attestation; it is not an independent identity or legal-guardianship verification.
- Role is assigned once from validated signup metadata to an administrator-controlled profile column. Editable user metadata is never used to authorize teacher access.
- Teacher approval is manual in this stage. A verified teacher still gets no access to student profiles without a future explicit class-membership policy.
- Existing lesson records remain browser-local, namespaced by verified account ID. They are not synchronized or accessible to teachers. Demo uses a separate storage namespace. Signing out does not erase this device's learning data; users can erase it from My progress.
- Terms, operator contact details, retention/deletion procedures, final child/guardian onboarding and institutional approval processes must be finalized before actual school enrollment. The information page explicitly describes pilot limits; it is not a claim of legal compliance.

## Local

`npm ci`, then `npm test` and `npm run build`. For serverless API local testing use Vercel's dev environment; a plain Python HTTP server only serves the demo frontend and cannot run `/api/auth`.
