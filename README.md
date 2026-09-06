# Branding Curve — Agency Daily Reporting

Mobile-first daily reporting for marketers and the agency owner.

Core flow: **Login → assigned clients → select client → speak/write today's update → save. Admin can see it.**

## Run the app (demo mode)

If you have not connected Supabase yet, the app still works with sample data.

1. Open Terminal in this folder.
2. Run `npm install`
3. Run `npm run dev`
4. Open the URL it prints (usually http://localhost:3000)

Demo shortcuts on the login screen:

- Marketer: `rahim@brandingcurve.com` / `demo1234`
- Admin: `farhan@brandingcurve.com` / `demo1234`

---

## Connect the real database (Supabase)

Do these steps in order. You do not need to write any SQL yourself except pasting the files we already created.

### 1. Create a Supabase project

Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and create a project.

### 2. Run the database setup

1. In Supabase, open **SQL Editor**.
2. Click **New query**.
3. Open the file `supabase/schema.sql` in this project, copy **all** of it, paste it into the editor, click **Run**.
   This file is for a **new** Supabase project. It is not a full migrator: re-running it will refresh functions, triggers, policies, and grants, but it will not add new enum values or constraints to tables that already exist.

### 3. Add environment variables

In this project folder, create a file named `.env.local` (you can copy `.env.example`).

Put only these two values for now (from **Project Settings → API**):

```
NEXT_PUBLIC_SUPABASE_URL=paste-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste-anon-key-here
```

Do **not** put the service role key in any variable that starts with `NEXT_PUBLIC_`.

Restart the app (`npm run dev`) after saving `.env.local`.

Demo login buttons disappear once these variables are set. That is expected.

### 4. Create the first admin (safe bootstrap)

Public signup is off. A new account is **always** created as a marketer. Nobody can become admin by typing `role=admin` in signup metadata.

1. In Supabase go to **Authentication → Users → Add user**.
2. Create a user with **your email** and a password. Confirm/auto-confirm the email if asked.
3. Open **SQL Editor** again.
4. Open `supabase/bootstrap_admin.sql` and replace `YOUR_EMAIL_HERE` with that same email. If you leave the placeholder, the script refuses to run.
5. Paste and **Run**. Confirm the result row shows `role = admin` and `is_active = true`.

### 5. Test admin login

1. Open the app.
2. Log in with the admin email and password you just created.
3. You should see the admin Home (today’s reporting across the agency).

### 6. Create the first marketer

**Option A — Dashboard (always works)**

1. **Authentication → Users → Add user**
2. Enter the marketer’s email and a temporary password.
3. Tell them to log in with that email and password.
4. They will appear as a marketer automatically.

**Option B — Invite from the Team screen**

This sends an email invite. It stays **disabled** until a server-only key is configured.

If you want it later, add this to `.env.local` (never share this key, never prefix it with `NEXT_PUBLIC_`):

```
SUPABASE_SERVICE_ROLE_KEY=paste-service-role-key-here
```

Then restart the app. Team → Invite will send a Supabase invite email.

### 7. Assign a client

1. Log in as admin.
2. Profile → **Create Client** (or Clients → +).
3. Save the client.
4. Profile → **Team** → tap the marketer.
5. Check the clients they should own → **Save assignments**.
6. Ask the marketer to refresh / open Clients. The client should appear.

### 8. Submit the first real daily report

1. Log in as that marketer.
2. Tap **Report** (center button).
3. Select the assigned client.
4. Speak or type today’s update. Edit the text if needed.
5. Tap **Save Report**.
6. Log in as admin and open that client’s timeline. The report should be there.

If today’s report already exists, the same screen becomes **Edit Report** instead of creating a second row.

---

## Notes

- Reporting status is calculated from saved daily reports. There is no separate “reported today” switch.
- Voice input uses the browser. It is never stored as audio. You can always type instead.
- Archived clients keep their reports. They are not hard-deleted.
