# Google Analytics 4 (GA4) Setup Guide

## 🎯 Overview

Your Embedded Map File Analyzer now has **complete Google Analytics 4 integration** with:
- ✅ Automatic page view tracking with React Router
- ✅ Custom event tracking for key user actions
- ✅ Environment variable configuration
- ✅ Reusable `useAnalytics()` hook
- ✅ Development/Production mode support

---

## 📦 What's Been Implemented

### 1. **Files Created/Modified**

#### **New Files:**
- `frontend/.env` - Environment variables (GA Measurement ID)
- `frontend/.env.example` - Template for .env file
- `frontend/src/hooks/useAnalytics.ts` - Analytics hook

#### **Modified Files:**
- `frontend/src/App.tsx` - Integrated page tracking and event tracking
- `frontend/src/components/FileUploader.tsx` - File upload tracking
- `frontend/src/components/SectionsTable.tsx` - Export tracking

### 2. **Dependencies Installed**
```bash
react-ga4@^2.1.0
```

---

## 🚀 Quick Setup (3 Steps)

### **Step 1: Get Your GA4 Measurement ID**

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property (or use existing)
3. Navigate to: **Admin** → **Data Streams** → **Web**
4. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)

### **Step 2: Add Measurement ID to .env**

Edit `frontend/.env`:
```env
# Replace with your actual Measurement ID
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### **Step 3: Restart Dev Server**

```bash
# Stop current server (Ctrl+C)
cd frontend
npm run dev
```

**That's it!** Analytics is now tracking.

---

## 📊 Events Being Tracked

### **Automatic Events:**
| Event | When It Fires | Data Collected |
|-------|---------------|----------------|
| `page_view` | Every route change | Page path, title |

### **Custom Events:**
| Event | When It Fires | Data Collected |
|-------|---------------|----------------|
| `file_upload` | User uploads .map file | File size, file type |
| `analysis_complete` | Analysis finishes | Section count, total size |
| `comparison_done` | Build comparison completes | Build sizes, size diff |
| `export_report` | User exports CSV/JSON/PDF | Format, section |
| `tab_change` | User switches tabs | Tab name |
| `section_clicked` | User clicks section | Section name |
| `mock_data_toggled` | User toggles mock data | Enabled/disabled |
| `anomaly_detected` | Anomaly found | Anomaly type, severity |

---

## 🔍 Verify It's Working

### **Development Mode (localhost)**

When running locally, you'll see console logs:
```
✅ Google Analytics initialized: G-XXXXXXXXXX
🔍 [Analytics - Dev Mode] Page view: /
📊 Event tracked: file_upload { file_size: 12345, file_type: 'map' }
```

### **Google Analytics Real-Time View**

1. Open [Google Analytics](https://analytics.google.com/)
2. Navigate to: **Reports** → **Realtime**
3. Open your app in browser
4. You should see:
   - **Active users**: 1
   - **Page views**: Real-time as you navigate
   - **Events**: As you interact

**Test Checklist:**
- [ ] Upload a file → See `file_upload` event
- [ ] Switch tabs → See `tab_change` event
- [ ] Export CSV → See `export_report` event
- [ ] Click section → See `section_clicked` event

---

## 💻 Code Examples

### **Using the Analytics Hook**

```tsx
import { useAnalytics } from './hooks/useAnalytics';

function MyComponent() {
  const analytics = useAnalytics();

  const handleButtonClick = () => {
    // Track custom event
    analytics.trackEvent({
      name: 'button_clicked',
      params: { button_name: 'download' }
    });
  };

  return <button onClick={handleButtonClick}>Download</button>;
}
```

### **Using Helper Functions**

```tsx
import { Analytics } from './hooks/useAnalytics';

// Track file upload
Analytics.trackFileUpload(fileSize, 'map');

// Track comparison
Analytics.trackComparison(build1Size, build2Size, sizeDiff);

// Track export
Analytics.trackExport('csv', 'sections');
```

### **Track Custom Events**

```tsx
import { trackEvent } from './hooks/useAnalytics';

trackEvent({
  name: 'custom_event',
  params: {
    category: 'user_action',
    value: 123
  }
});
```

---

## 🎯 Viewing Analytics Data

### **Real-Time Reports**
**Path:** Reports → Realtime

**What to check:**
- Active users right now
- Page paths being viewed
- Events happening live
- Traffic sources

### **Event Reports**
**Path:** Reports → Engagement → Events

**What you'll see:**
- Total event count
- Event names and parameters
- User engagement metrics

### **Custom Reports**
**Path:** Explore → Create custom report

**Recommended reports:**
1. **File Upload Funnel:**
   - Sessions → File uploads → Analysis complete

2. **Export Activity:**
   - Export events by format (CSV/JSON/PDF)
   - Export count by date

3. **User Flow:**
   - Tab switches
   - Section clicks
   - Export patterns

---

## 🛠️ Configuration Options

### **Environment Variables**

```env
# Google Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional: App metadata
VITE_APP_NAME=Embedded Map File Analyzer
VITE_APP_VERSION=1.0.0
```

### **Test Mode (Development)**

The analytics runs in **test mode** during development:
- Events logged to console
- No production data pollution
- Easy debugging

Set `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX` to enable production mode.

### **Disable Analytics**

To disable analytics:
```env
# Leave empty or use placeholder
VITE_GA_MEASUREMENT_ID=
```

---

## 📈 Analytics Best Practices

### **1. Track User Flows**

```tsx
// Track complete user journey
Analytics.trackFileUpload(fileSize);        // Step 1
Analytics.trackAnalysis(sectionCount);      // Step 2
Analytics.trackExport('pdf', 'summary');    // Step 3
```

### **2. Track Errors**

```tsx
try {
  // Your code
} catch (error) {
  trackEvent({
    name: 'error_occurred',
    params: {
      error_message: error.message,
      error_location: 'FileUploader'
    }
  });
}
```

### **3. Track Performance**

```tsx
const startTime = performance.now();
// Perform analysis
const duration = performance.now() - startTime;

trackEvent({
  name: 'analysis_performance',
  params: {
    duration_ms: Math.round(duration),
    sections_count: sections.length
  }
});
```

---

## 🔒 Privacy & GDPR Compliance

### **Current Implementation:**
✅ **No personal data collected** - Only anonymous usage data
✅ **Client-side only** - No server-side tracking
✅ **Environment-based** - Easy to disable
✅ **No cookies without consent** - GA4 respects browser settings

### **Optional: Add Cookie Consent**

To be fully GDPR compliant, add a consent banner:

```bash
npm install react-cookie-consent
```

```tsx
import CookieConsent from 'react-cookie-consent';

function App() {
  return (
    <>
      {/* Your app */}

      <CookieConsent
        location="bottom"
        buttonText="Accept"
        declineButtonText="Decline"
        enableDeclineButton
        onAccept={() => initializeGA()}
      >
        We use cookies to analyze site traffic.
      </CookieConsent>
    </>
  );
}
```

---

## 🐛 Troubleshooting

### **Issue: "GA not initialized"**

**Fix:** Check `.env` file has correct Measurement ID
```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### **Issue: "Events not showing in GA"**

**Checklist:**
- [ ] Measurement ID is correct
- [ ] Wait 24-48 hours for historical data
- [ ] Check **Realtime** view for immediate feedback
- [ ] Verify dev server restarted after changing .env

### **Issue: "Console shows errors"**

**Fix:** Ensure `react-ga4` is installed:
```bash
cd frontend
npm install react-ga4
```

### **Issue: "Too many events"**

**Fix:** Adjust tracking frequency in code:
```tsx
// Debounce section clicks
const debouncedTrack = debounce(() => {
  Analytics.trackSectionClick(sectionName);
}, 500);
```

---

## 📊 Production Deployment

### **Before Deploying:**

1. **Verify Measurement ID**
   ```bash
   # Check .env file
   cat frontend/.env
   ```

2. **Build for production**
   ```bash
   cd frontend
   npm run build
   ```

3. **Test production build**
   ```bash
   npm run preview
   # Open http://localhost:4173
   # Check console for GA initialization
   ```

### **After Deployment:**

1. **Verify in Google Analytics**
   - Go to Realtime view
   - Visit your live site
   - Confirm events are tracking

2. **Set up custom dashboards**
   - Create conversion goals
   - Set up funnels
   - Configure alerts

---

## 📁 File Structure

```
frontend/
├── .env                           # Your GA Measurement ID (gitignored)
├── .env.example                   # Template file
└── src/
    ├── hooks/
    │   └── useAnalytics.ts       # Analytics hook and helpers
    ├── components/
    │   ├── FileUploader.tsx      # Tracks file uploads
    │   └── SectionsTable.tsx     # Tracks exports
    └── App.tsx                    # Tracks page views, tab changes
```

---

## 🎓 Advanced Usage

### **Track User Properties**

```tsx
import ReactGA from 'react-ga4';

ReactGA.set({
  user_properties: {
    platform: 'web',
    app_version: import.meta.env.VITE_APP_VERSION,
    theme: 'dark'
  }
});
```

### **Track Timing**

```tsx
trackEvent({
  name: 'timing_complete',
  params: {
    name: 'map_parse',
    value: 1234, // milliseconds
    event_category: 'performance'
  }
});
```

### **Enhanced E-commerce (if monetizing)**

```tsx
import ReactGA from 'react-ga4';

ReactGA.event('purchase', {
  transaction_id: 'T12345',
  value: 25.42,
  currency: 'USD',
  items: [
    {
      item_id: 'SKU_12345',
      item_name: 'Pro Plan',
      price: 25.42
    }
  ]
});
```

---

## 📚 Resources

### **Documentation:**
- [GA4 Official Docs](https://support.google.com/analytics/answer/9304153)
- [react-ga4 GitHub](https://github.com/PriceRunner/react-ga4)
- [GA4 Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)

### **Tools:**
- [Google Analytics](https://analytics.google.com/)
- [GA Debugger Chrome Extension](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)
- [GA4 Event Builder](https://ga-dev-tools.web.app/ga4/event-builder/)

---

## ✅ Success Checklist

After setup, verify:

- [ ] `.env` file has your Measurement ID
- [ ] Dev server restarted
- [ ] Console shows GA initialization
- [ ] Realtime view shows your session
- [ ] Page views are tracked
- [ ] Custom events appear in Realtime
- [ ] No console errors
- [ ] Privacy policy updated (if needed)
- [ ] Cookie consent added (if required)
- [ ] Production build tested

---

## 🎉 You're All Set!

Your app now tracks:
- 🔍 Page views automatically
- 📁 File uploads
- 📊 Analysis completion
- 🔄 Build comparisons
- 💾 Data exports
- 🎛️ User interactions

**Next Steps:**
1. Monitor analytics weekly
2. Create custom dashboards
3. Set up conversion goals
4. Analyze user behavior
5. Optimize based on data

---

**Questions or Issues?**
- Check the troubleshooting section
- Review console logs
- Test in Realtime view
- Verify .env configuration

**Version:** 1.0.0
**Last Updated:** 2025-10-06
