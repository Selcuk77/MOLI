# MOLİ learning workspace — activation and limits

Live entry: https://moli-orcin.vercel.app/learn (verified student account).
Guest preview: https://moli-orcin.vercel.app/learn?demo=1.
The existing ramp simulation remains at /lesson. Student sign-in now opens /learn.

## 1. Activate account-backed learning storage

In the **MOLI** Supabase SQL editor, run `supabase/002_learning.sql` once, after the already-installed `001_accounts.sql`. It creates learning records, verified contacts, and delivery claims with RLS. Refresh /learn afterward. No service-role key is needed for normal learning records; the existing publishable key and the verified user session are used.

Until migration is installed, /learn visibly uses an isolated device-local pilot record. It does not claim to sync. Guest records and each account have separate namespaces. Export any pilot records before changing devices. Device-local pilot records are not automatically imported into cloud records. Network errors do not silently replace cloud records with local records.

## 2. What the pilot implements

- TR/EN assessment: 26 numeric/multiple-choice questions (2 per topic), second-item difficulty based on the previous answer; resumable assessment; transparent baseline/80% target chart. The sample is not a standardized LGS score or cognitive/intelligence test.
- Thirteen topic groups covering the initial Grade 8 math route. Weak available topics are prioritized while respecting authored prerequisite dependencies. These are pilot authored explanations and parameterized practice families, not a complete validated LGS question bank.
- Each topic: three short explanations/checkpoints → five-question mastery test → 80% pass. Failed tests lead to topic practice; two consecutive correct practice answers allow a fresh parameterized test. Passing unlocks the next topic; optional extra tests do not revoke previously earned progress.
- Numeric grading is deterministic server-side for account records. Fractions and comma decimals are accepted. Written reasoning is stored but **not automatically rubric-graded**. Your reviewed rubrics and richer LGS content are still required.
- Browser TTS is opt-in; question/explanation playback has buttons. Speech recognition, where supported, fills the reasoning field for review, never auto-submits. Browser providers may process audio; this app stores text only.
- Progress: latest 1,000 events, 600 transcript messages, latest 30 tests/topic, latest 300 answers/topic. Approximate active minutes require visible page and recent interaction; no background heartbeat is counted as study. These are bounded pilot records, not an unlimited archive.
- Report export explicitly selects results, answers, transcript and plan. Downloading does not email or disclose records. Teacher/guardian account links and live authorized dashboards are not implemented by these exports.
- Editable weekly days/time/duration/timezone; recommendation based on baseline; future session list; UTC calendar export with ten-minute display alarms. Calendar app delivery depends on the app configuration.

## 3. Enable free-form AI tutoring (optional)

The server uses the installed AI SDK 7 with Vercel AI Gateway, authenticated using Vercel OIDC or `AI_GATEWAY_API_KEY` (server-only). Select an available text model in the Gateway catalog and set `AI_MODEL` to its provider/model identifier, then redeploy. No model ID is assumed in code. Verify Gateway access/billing in the Vercel project before enabling.

Without `AI_MODEL`, the UI says it uses prepared lesson guidance. AI responses are topic-scoped, short, escaped as text, saved with the conversation, and never determine grades or unlock topics. AI tutoring is disabled during mastery tests. Per-user limits: 30 requests/hour, at least 5 seconds apart. Only topic context and recent topic conversation are sent; account name/email are not included in the model prompt. Provider service behavior and content quality require a real configured smoke test.

## 4. Enable reminders (optional — no scheduler configured automatically)

Required for either channel: `CRON_SECRET`, server-only `SUPABASE_SERVICE_ROLE_KEY`, and a scheduler invoking **GET /api/reminders once per minute** with `Authorization: Bearer <CRON_SECRET>`. Configure the scheduler using a hosting plan/service that supports minute-level dispatch. A daily job cannot send ten-minute reminders. Do not set `REMINDERS_ENABLED=true` until this scheduler is active and tested; checkboxes stay disabled while unconfigured.

Email additionally requires `RESEND_API_KEY` and `REMINDER_FROM` using a verified sender. Recipient is the authenticated account’s verified email (guardian email for student accounts). Auth email SMTP is a separate Supabase setting; it does not enable these reminders.

SMS additionally requires Twilio `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`, and `TWILIO_FROM`. The learner must verify ownership using a code before selecting SMS. Verify send rate: at least 60 seconds apart, at most 3 sends in the rolling reservation window. Twilio Verify enforces verification-check limits. Use provider country/recipient restrictions and spending limits before public use. No SMS credentials or phone number should be pasted into chat.

The worker dispatches 9–10 minutes before start, reads the current plan/opt-in, and records a unique claim per account/session/channel. Resend receives the same idempotency key. For SMS, a claimed delivery with an uncertain provider response is not blindly retried; inspect `moli_deliveries` and provider logs. Status `accepted` means provider acceptance, not confirmed delivery to the device. Monitor failed/unknown claims and scheduler health. No reminders are sent during development tests.

## 5. End-to-end verification after activation

Use an adult-operated test student account: finish assessment → inspect chart → open first topic → intentionally fail a test → finish practice → retest → verify next unlock → save plan → export selected report → reload/sign in on another device and confirm cloud persistence. Set TR/EN and check all four tabs. Confirm another account has no access to these records. After AI setup, ask a mathematical question and verify a saved reply. After reminder setup, opt in on a verified test address/phone and schedule a near-future session; confirm one delivery per channel and that opt-out prevents subsequent deliveries.

Local checks: `npm test`, `npm run build`, `npm audit --omit=dev`. DOM-based interaction coverage is included; real audio, provider delivery, configured cloud SQL and real browser visual checks require runtime verification.


## Classroom revision (October 15)

All legacy /lesson links now redirect to /learn while preserving demo/query intent; authentication and teacher previews link directly to the unified workspace. Existing tests, baseline and mastery records are retained. No additional SQL migration is required.

Each topic now has five authored teaching sections: real situation, mathematical model, worked board steps, misconception/reasoning, and transfer. Only after the lecture does guided solving begin. The learner tries each of two contextual questions first; incorrect attempts keep the same question. Assistance reveals a maximum of three authored steps. A separate ready screen starts the independent test. Assessment and independent tests show a neutral MOLI presence but do not allow solution assistance. All grading remains deterministic; optional explanation text is saved, not rubric-graded.

KaTeX is bundled locally by scripts/vendor.mjs. The board renders accessible MathML/HTML, with trust disabled, rather than showing TeX source. Fraction entry has separate numerator/denominator fields; questions use contextual models and diagrams. Speech is browser TTS with explicit enable/listen controls; authored board lines highlight sequentially. Microphone input transcribes into a reviewed question before submission. Provider audio behavior remains browser-dependent.

The AI endpoint now uses structured outputs (speech, board steps, follow-up), with current slide, question, attempt, prior reasoning and baseline context. It never substitutes a fixed paragraph when AI is missing. Failed connections return actionable typed errors and preserve the question. New replies appear on the shared board and are saved in the learning transcript. Authored demonstrations remain available even when the provider is unavailable. Initial production model selection is configured in AI_MODEL; model names remain outside source.

AI_VERIFY_ON_BUILD=true enables a single fixed, non-personal build smoke request. It logs only the generated mathematical content and a success marker, or a typed activation/credit/auth status. Disable the flag after checking the deployment logs to avoid repeated smoke requests in subsequent builds. No payment settings, credits or budgets are increased automatically.
