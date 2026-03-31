# OrixLink AI — 48-Hour Production Launch Checklist

Use this as a strict pass/fail gate for launch readiness.  
Mark each item only after evidence is captured (screenshot, SQL result, dashboard status, or logs).

## HOUR 0-4: Critical blockers

These must pass before any user touches the app.

- [ ] **1. Bootstrap route fix verified**
  - **Step:** Sign in as an already-paid user.
  - **Verify (Supabase SQL editor):**
    ```sql
    SELECT user_id, tier, status, updated_at
    FROM public.subscriptions
    WHERE user_id = 'PAID_USER_UUID';
    ```
  - **Pass:** `subscriptions.tier` remains paid (`pro`, `family`, or `lifetime`) after sign-in.
  - **Fail:** Tier reverts to `free` on sign-in.

- [ ] **2. attempt_assessment RPC contract verified**
  - **Step:** Run one assessment as a free user in the app.
  - **Optional API verify (browser network):** `POST /api/assess` returns `200` with non-empty `response`.
  - **Pass:** Assessment completes and result renders normally.
  - **Fail:** Assessment returns error, invalid usage response, or blank output.

- [ ] **3. PWA icons verified**
  - **Command:**
    ```bash
    npm run build
    ```
  - **Step:** Open app in browser and confirm favicon appears in tab.
  - **Pass:** No missing-asset icon issues and favicon renders.
  - **Fail:** Broken/missing tab icon or missing referenced assets.

- [ ] **4. usage_tracking unique constraint verified**
  - **SQL (Supabase SQL editor):**
    ```sql
    SELECT indexname
    FROM pg_indexes
    WHERE tablename = 'usage_tracking';
    ```
  - **Pass:** Unique index exists for `(user_id, period_month)`.
  - **Fail:** No unique index for `(user_id, period_month)`.

- [ ] **5. Migration 018 trigger verified**
  - **SQL (Supabase SQL editor):**
    ```sql
    SELECT trigger_name
    FROM information_schema.triggers
    WHERE event_object_table = 'users'
      AND trigger_schema = 'public';
    ```
  - **Pass:** `on_auth_user_created` appears.
  - **Fail:** Trigger missing.

- [ ] **6. Migration 019 RPC verified**
  - **SQL (Supabase SQL editor):**
    ```sql
    SELECT routine_name, data_type
    FROM information_schema.routines
    WHERE routine_name = 'attempt_assessment';
    ```
  - **Pass:** Return type matches current app expectation in `app/api/assess/route.ts`.
  - **Fail:** Return type does not match app parser expectation.

- [ ] **7. Anonymous deletion cron verified**
  - **Step:** In Supabase dashboard, confirm `pg_cron` is enabled.
  - **SQL (Supabase SQL editor):**
    ```sql
    SELECT *
    FROM cron.job;
    ```
  - **Pass:** Both jobs are listed:
    - `delete-old-anonymous-assessments`
    - `send-orixlink-reminders`
  - **Fail:** Either job missing.

## HOUR 4-8: Revenue integrity

- [ ] **8. Full Pro signup smoke test**
  - **Steps:**
    - New email -> select Pro -> create account
    - Confirm email -> land on Stripe checkout
    - Complete checkout with `4242 4242 4242 4242`
  - **SQL verify:**
    ```sql
    SELECT tier, status, assessments_cap
    FROM public.subscriptions
    WHERE user_id = 'NEW_PRO_USER_UUID';
    ```
  - **Pass:** `tier = pro`, cap effectively `150`.
  - **Fail:** Tier/cap not updated correctly.

- [ ] **9. Google OAuth Pro signup smoke test**
  - **Steps:**
    - New incognito window
    - Select Pro -> Continue with Google
    - Complete OAuth -> land on Stripe checkout
    - Complete checkout with test card `4242`
  - **SQL verify:**
    ```sql
    SELECT tier, status
    FROM public.subscriptions
    WHERE user_id = 'NEW_GOOGLE_PRO_USER_UUID';
    ```
  - **Pass:** `tier = pro`.
  - **Fail:** OAuth flow does not route to checkout or tier not set.

- [ ] **10. Credit pack purchase test**
  - **Steps:** As Pro user, buy Starter pack on pricing page.
  - **SQL verify:**
    ```sql
    SELECT credits_purchased, credits_remaining, stripe_payment_intent_id, purchased_at
    FROM public.credits
    WHERE user_id = 'PRO_USER_UUID'
    ORDER BY purchased_at DESC
    LIMIT 1;
    ```
  - **Pass:** Row exists with `credits_remaining = 25`.
  - **Fail:** No row or incorrect remaining credits.

- [ ] **11. Stripe webhook verified in production**
  - **Step:** Stripe Dashboard -> Developers -> Webhooks -> endpoint events.
  - **Pass:** Recent relevant events show HTTP `200`.
  - **Fail:** Non-200 responses, retries, or failed signatures.

- [ ] **12. Billing portal test**
  - **Steps:** As Pro user, click **Manage Billing**.
  - **Pass:** Redirects to Stripe billing portal showing active subscription.
  - **Fail:** Portal fails to open or missing active subscription.

## HOUR 8-16: Family tier

- [ ] **13. Family invite by email test**
  - **Steps:**
    - As owner, invite test email
    - Verify branded email delivered (Resend)
    - Recipient joins via link
  - **SQL verify:**
    ```sql
    SELECT owner_user_id, member_user_id, invited_email, status, joined_at
    FROM public.family_members
    WHERE owner_user_id = 'OWNER_UUID'
    ORDER BY invited_at DESC;
    ```
  - **Pass:** Joined row has `status = active`.
  - **Fail:** Invite sent but join does not activate.

- [ ] **14. Family invite by code test**
  - **Steps:**
    - Owner generates shareable code
    - New account joins with code only
  - **Pass:** Join succeeds without pre-existing email-specific invite match.
  - **Fail:** Join blocked due to email mismatch.

- [ ] **15. Family pool enforcement test**
  - **Steps:** Owner and member each run assessments.
  - **SQL verify (current month):**
    ```sql
    SELECT user_id, period_month, assessments_used, assessments_cap
    FROM public.usage_tracking
    WHERE user_id IN (
      'OWNER_UUID',
      'MEMBER_UUID_1',
      'MEMBER_UUID_2'
    )
      AND period_month = to_char(now(), 'YYYY-MM');
    ```
  - **Pass:** Family dashboard totals reflect summed usage correctly.
  - **Fail:** Pool total/drain is inconsistent across members.

- [ ] **16. Family daily limit test**
  - **Steps:** As one family member, submit 10 assessments, then attempt an 11th same day.
  - **Pass:** 11th attempt is blocked with daily limit message.
  - **Fail:** 11th attempt succeeds or generic error shown.

- [ ] **17. Owner cancellation cascade test**
  - **Steps:**
    - Cancel owner subscription in Stripe portal
    - Wait for `customer.subscription.deleted` webhook processing
  - **SQL verify:**
    ```sql
    SELECT user_id, tier, status
    FROM public.subscriptions
    WHERE user_id IN ('OWNER_UUID', 'MEMBER_UUID_1', 'MEMBER_UUID_2');
    ```
    ```sql
    SELECT owner_user_id, member_user_id, status
    FROM public.family_members
    WHERE owner_user_id = 'OWNER_UUID';
    ```
  - **Pass:** Members downgraded to free; family links no longer active.
  - **Fail:** Members remain family after owner cancellation finalizes.

## HOUR 16-24: Auth and UX

- [ ] **18. Anonymous assessment test**
  - **Steps:**
    - Logged out: run first assessment in browser
    - Attempt second assessment in same browser session context
  - **Pass:** First works; second blocked with cap + conversion modal.
  - **Fail:** Anonymous can continue indefinitely or gets non-actionable failure.

- [ ] **19. Session timeout test**
  - **Steps:**
    - Sign in and stay inactive until warning window
    - Click **Keep me signed in**
  - **Pass:** Warning appears and timer resets; no forced sign-out.
  - **Fail:** User is signed out despite keep-alive action.

- [ ] **20. Mobile smoke test at 375px**
  - **Steps:** Chrome DevTools device width `375px`; test:
    - `/`
    - `/assessment`
    - `/assessment/results`
    - `/pricing`
    - `/account`
    - `/history`
    - `/family`
  - **Pass:** No horizontal scroll; no clipped or broken layouts.
  - **Fail:** Any page has overflow or unusable controls.

- [ ] **21. Email confirmation test**
  - **Steps:**
    - New email signup
    - Verify branded OrixLink confirmation email arrives
    - Click confirm link
  - **Pass:** User lands correctly (dashboard for free or checkout for paid path).
  - **Fail:** Generic Supabase template sends, or confirm flow breaks.

## HOUR 24-48: Polish and monitoring

- [ ] **22. pg_cron reminder job test**
  - **Steps:** Set reminder from results surface.
  - **SQL verify (Supabase):**
    ```sql
    SELECT *
    FROM cron.job_run_details
    ORDER BY start_time DESC
    LIMIT 20;
    ```
  - **Pass:** Reminder job fires on schedule without repeated failures.
  - **Fail:** Job does not run or consistently errors.

- [ ] **23. SMTP verified via Resend**
  - **Step:** Resend dashboard -> recent sends.
  - **Pass:** Recent sends appear from configured OrixLink sender identity.
  - **Fail:** Sends failing, unverified domain, or wrong sender profile.

- [ ] **24. Legal page review**
  - **Step:** Manually read `/legal`.
  - **Pass:** No claims about unbuilt features; retention/compliance statements align with runtime behavior.
  - **Fail:** Any legal copy contradicts actual product behavior.

- [ ] **25. Pricing page review**
  - **Step:** Manually review all tier bullets on `/pricing` and `/auth/signup`.
  - **Pass:** Every bullet maps to shipped behavior.
  - **Fail:** Any feature claim cannot be demonstrated in app.

- [ ] **26. README accuracy check**
  - **Step:** Review `README.md` against current app and asset state.
  - **Pass:** No references to missing assets/undeployed features.
  - **Fail:** Any mismatch between docs and production reality.

- [ ] **27. Admin dashboard smoke test**
  - **Steps:** Sign in as admin and open `/admin`.
  - **Pass:** Analytics/controls load without runtime/API errors.
  - **Fail:** Access/control failures or broken data loading.

- [ ] **28. Error state test**
  - **Steps:** Trigger known cap-reached scenario.
  - **Pass:** User sees specific actionable message (not generic “something went wrong”).
  - **Fail:** Generic error or unclear next step.

## FINAL GATE

All 28 items must pass before:
- Any public LinkedIn post
- Any personal network outreach
- Any paid marketing spend

Items **1-7** must pass before any user is given the URL.
