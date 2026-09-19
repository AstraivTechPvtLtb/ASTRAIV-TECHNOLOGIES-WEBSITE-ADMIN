# Google Analytics 4 (GA4) Integration Setup Guide

This guide walks you step-by-step through setting up **Google Analytics 4 (Standard / Free)**, connecting the **Google Analytics Data API**, and viewing live analytics natively in your AstraIV Admin Portal.

> [!NOTE]
> - **Cost**: 100% Free (Uses GA4 Standard and free Google Cloud Service Account tier).
> - **BigQuery**: Not required.
> - **Security**: Service account keys remain strictly on the backend (`admin`) and are never exposed to the client or browser.

---

## Architecture Overview

```
Client Website (Next.js)
       ↓ (gtag.js tracking tag with Measurement ID: G-XXXXXXXXXX)
Google Analytics 4 Property
       ↓ (Free GA4 Data API v1beta)
Admin Backend (Next.js Server API Routes + In-Memory Cache)
       ↓ (Admin Session Authenticated)
Admin Portal React Dashboard (/analytics with Recharts)
```

---

## Step 1: Create a Google Analytics 4 Property

1. Go to [Google Analytics](https://analytics.google.com/) and sign in with your Google account.
2. In the bottom-left corner, click the **Admin** gear icon ⚙️.
3. In the *Account* column, select your account (or click **+ Create Account**).
4. In the *Property* column, click **+ Create Property**:
   - **Property name**: `Astraiv Technologies`
   - **Reporting time zone**: Select your time zone (e.g., India Time `GMT+05:30` or your regional preference).
   - **Currency**: Select your currency (e.g., USD `$`, INR `₹`).
5. Click **Next**, fill in your business details (IT / Technology), and click **Create**.
6. Accept the Terms of Service.

---

## Step 2: Create a Web Data Stream & Find Measurement ID

1. In your newly created GA4 Property, go to **Admin > Data collection and modification > Data Streams**.
2. Select the **Web** platform.
3. Configure the stream:
   - **Website URL**: `https://www.astraivtechnologies.com` (or `http://localhost:3000` for local development).
   - **Stream name**: `Astraiv Web Client`.
   - Leave *Enhanced measurement* enabled (tracks page views, scrolls, outbound clicks, file downloads automatically).
4. Click **Create stream**.
5. Once created, you will see your **Measurement ID** in the top right (starts with `G-`, e.g., `G-1A2B3C4D5E`).
6. Copy this **Measurement ID**.

---

## Step 3: Add Tracking Tag to Client Website

Add the Measurement ID to your `client/.env` file:

```env
# In client/.env:
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

> The tracking script is already integrated in `client/src/views/analytics/google-analytics.tsx` and mounted in `client/src/app/[locale]/layout.tsx`. It uses Next.js `next/script` with `strategy="afterInteractive"`. If `NEXT_PUBLIC_GA_MEASUREMENT_ID` is present, it automatically sends page views to your GA4 property.

---

## Step 4: Find Your GA4 Numeric Property ID

1. In [Google Analytics](https://analytics.google.com/), click **Admin** ⚙️.
2. In the *Property* column, click **Property Details** (or **Property Settings**).
3. In the top-right corner of the Property Details pane, locate the numeric **Property ID** (e.g., `483920194`).
   > *Note: This is a numeric ID, different from the `G-` Measurement ID.*
4. Copy this numeric Property ID.

---

## Step 5: Create a Google Cloud Project & Enable Google Analytics Data API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. In the top project selector bar, click **Select a project > New Project**:
   - **Project Name**: `astraiv-analytics` (or select your existing Google Cloud project).
   - Click **Create**.
3. Once the project is selected, open the navigation menu and go to **APIs & Services > Library**.
4. In the search box, search for:
   ```
   Google Analytics Data API
   ```
5. Click **Google Analytics Data API** (v1beta) and click the blue **Enable** button.

---

## Step 6: Create a Google Cloud Service Account

1. In Google Cloud Console, navigate to **IAM & Admin > Service Accounts**.
2. Click **+ Create Service Account** at the top:
   - **Service account name**: `ga4-admin-reader`
   - **Service account ID**: `ga4-admin-reader`
   - **Description**: `Read-only service account for AstraIV Admin Analytics Dashboard`
3. Click **Create and Continue**.
4. **Grant access to project**: You can leave this role optional or select *Project > Viewer*. Click **Continue**.
5. Click **Done**.
6. Find your newly created service account in the list (its email looks like `ga4-admin-reader@your-project-id.iam.gserviceaccount.com`).
7. **Copy this service account email address.** You will need it in Step 7.

---

## Step 7: Generate and Download Private Key (JSON)

1. Click on the newly created service account email.
2. Go to the **Keys** tab.
3. Click **Add Key > Create new key**.
4. Select **JSON** format and click **Create**.
5. A JSON file will automatically download to your computer.
6. Rename this file to `service-account.json` (or place it in a secure location).
7. Move this file into your `admin/` folder:
   ```
   ASTRAIV TECHNOLOGIES WEBSITE/
   ├── admin/
   │   ├── service-account.json    <-- Place here
   │   ├── .env
   │   └── ...
   ```

> [!CAUTION]
> **Security Notice**: `admin/.gitignore` has already been configured to ignore `*service-account*.json`, `*credentials*.json`, and `*.key.json`. **Never commit your JSON service account key to GitHub or public repositories.**

---

## Step 8: Grant the Service Account Access in GA4

1. Return to [Google Analytics](https://analytics.google.com/).
2. In the bottom-left corner, click **Admin** ⚙️.
3. In the *Property* column, click **Property Access Management**.
4. Click the blue **+** button in the top-right corner and select **Add users**.
5. In the **Email addresses** field, paste the Google Cloud Service Account email from Step 6:
   ```
   ga4-admin-reader@your-project-id.iam.gserviceaccount.com
   ```
6. Under **Direct roles**, select **Viewer** (Read & Analyze).
7. Uncheck *Notify new users by email*.
8. Click **Add** in the top-right corner.

---

## Step 9: Configure Environment Variables in Admin

Open `admin/.env` and add the following two variables:

```env
# Google Analytics 4 Property ID (Numeric ID from Step 4)
GA_PROPERTY_ID=483920194

# Path to your downloaded service account JSON file (from Step 7)
GOOGLE_APPLICATION_CREDENTIALS=service-account.json
```

> **Alternative for Cloud Hosting (Vercel / Render / Railway / AWS)**:
> If you are deploying to a serverless platform where storing a file on disk is difficult, you can alternatively supply the service account JSON contents directly as a single environment variable:
> ```env
> GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
> ```

---

## Step 10: Start the Backend & Admin Portal

1. Open your terminal in the `admin` directory:
   ```bash
   cd admin
   npm run dev
   ```
   The admin portal will start at `http://localhost:3001`.

2. Open another terminal in the `client` directory (to generate visitor events):
   ```bash
   cd client
   npm run dev
   ```
   The client website will start at `http://localhost:3000`.

---

## Step 11: Verify API Endpoints

You can verify the backend API endpoints by visiting them in your browser or with `curl` (make sure you are logged into the admin portal in the same browser session):

- `GET http://localhost:3001/api/analytics/overview`
- `GET http://localhost:3001/api/analytics/users?range=30d`
- `GET http://localhost:3001/api/analytics/pages`
- `GET http://localhost:3001/api/analytics/sources`
- `GET http://localhost:3001/api/analytics/devices`
- `GET http://localhost:3001/api/analytics/countries`
- `GET http://localhost:3001/api/analytics/realtime`

> **Security Verification**: If you open an incognito window and visit `http://localhost:3001/api/analytics/overview` without logging in, the API returns:
> ```json
> { "error": "Unauthorized: Valid administrator session required." }
> ```
> with HTTP Status `401 Unauthorized`.

---

## Step 12: Open the Analytics Dashboard in Admin

1. Open `http://localhost:3001/login` in your browser.
2. Sign in with your administrator credentials:
   - Email: `admin@astraiv.com`
   - Password: `Password123` (or your configured `ADMIN_MASTER_PASSWORD`).
3. In the left navigation sidebar, click **Analytics**.
4. You will see:
   - **Live Active Users**: Real-time counter with pulse indicator.
   - **Date Range Selector**: Toggle between Last 7 Days, Last 30 Days, Last 90 Days, or Custom Date Range.
   - **6 KPI Metric Cards**: Total Users, New Users, Sessions, Page Views, Engagement Rate, Event Count.
   - **Users & Sessions Over Time**: Dual-series interactive line/area chart with dark tooltips.
   - **Most Visited Pages Table**: Searchable table with page views, users, average engagement duration, and pagination.
   - **Traffic Sources Breakdown**: Session volume by source and medium.
   - **Device Analytics**: Desktop vs Mobile vs Tablet breakdown with Donut Chart.
   - **Country Analytics**: Top visitor regions with volume bars.
   - **Client Technology**: Top Browsers and Operating Systems.

---

## Troubleshooting & FAQs

### Why does GA4 show 0 users initially?
Google Analytics 4 standard reports take 24–48 hours to fully process historical metrics for new properties. However, **Real-Time reports** (`/api/analytics/realtime` and the Real-time active users counter) reflect live traffic within 10–30 seconds. To verify:
1. Visit `http://localhost:3000` in your browser.
2. Click on a few pages (`/services`, `/pricing`, `/blog`).
3. Open `http://localhost:3001/analytics` in the Admin Portal and observe the Real-time counter.

### What if I see "Google Analytics 4 Setup Required" in the dashboard?
If credentials or `GA_PROPERTY_ID` are missing, the dashboard automatically activates **Live Demo Mode** with simulated realistic metrics. This allows you to explore and test the dashboard UI even before completing the Google Cloud steps. Once you complete Steps 7–9 and restart `npm run dev`, the dashboard seamlessly connects to live GA4 data.

### Is this service completely free?
Yes. Google Analytics 4 Standard and Google Analytics Data API v1beta provide generous free quotas (up to 10,000 requests per day per project), which is more than sufficient for high-volume enterprise admin dashboards. Our backend implements a 5-minute in-memory cache and request deduplication to minimize API requests and optimize speed.
