# Google Analytics 4 - Quick Reference Card

## ⚡ 3-Step Setup

```bash
# 1. Get your GA4 Measurement ID from analytics.google.com
#    Format: G-XXXXXXXXXX

# 2. Add to frontend/.env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# 3. Restart dev server
cd frontend
npm run dev
```

---

## 📊 Events Being Tracked

| Event | Trigger | Where |
|-------|---------|-------|
| `page_view` | Route change | Automatic |
| `file_upload` | Upload .map file | FileUploader |
| `analysis_complete` | Analysis done | App.tsx |
| `comparison_done` | Builds compared | App.tsx |
| `export_report` | CSV/JSON/PDF | SectionsTable |
| `tab_change` | Switch tabs | App.tsx |
| `section_clicked` | Click section | App.tsx |
| `mock_data_toggled` | Toggle mock data | App.tsx |

---

## 💻 Code Usage

### Basic Event Tracking
```tsx
import { Analytics } from './hooks/useAnalytics';

// Track file upload
Analytics.trackFileUpload(fileSize, 'map');

// Track comparison
Analytics.trackComparison(build1Size, build2Size, diff);

// Track export
Analytics.trackExport('csv', 'sections');
```

### Custom Events
```tsx
import { trackEvent } from './hooks/useAnalytics';

trackEvent({
  name: 'custom_action',
  params: { key: 'value' }
});
```

### Using Hook
```tsx
import { useAnalytics } from './hooks/useAnalytics';

function MyComponent() {
  const analytics = useAnalytics();

  const handleClick = () => {
    analytics.trackEvent({
      name: 'button_clicked',
      params: { button: 'download' }
    });
  };
}
```

---

## 🔍 Testing

### Console Logs (Development)
```
✅ Google Analytics initialized: G-XXXXXXXXXX
📄 Page view tracked: /
📊 Event tracked: file_upload { file_size: 12345 }
```

### Google Analytics Realtime
1. Open: [analytics.google.com](https://analytics.google.com/)
2. Go to: **Reports** → **Realtime**
3. See events as they happen

---

## 🎯 Helper Functions

```tsx
import { Analytics } from './hooks/useAnalytics';

Analytics.trackFileUpload(size, type)
Analytics.trackAnalysis(sectionCount, totalSize)
Analytics.trackComparison(build1, build2, diff)
Analytics.trackExport(format, section)
Analytics.trackTabChange(tab)
Analytics.trackSectionClick(name)
Analytics.trackMockDataToggle(enabled)
Analytics.trackAnomaly(type, severity)
```

---

## 📁 Files

```
frontend/
├── .env                      # Your GA ID here
├── .env.example              # Template
└── src/
    └── hooks/
        └── useAnalytics.ts   # Main hook
```

---

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| No events in GA | Wait 24-48 hours for data |
| Not initialized | Check .env has `VITE_GA_MEASUREMENT_ID` |
| Console errors | Run `npm install react-ga4` |
| Changes not applied | Restart dev server |

---

## ✅ Verification Checklist

- [ ] `.env` has Measurement ID
- [ ] Dev server restarted
- [ ] Console shows "✅ Google Analytics initialized"
- [ ] Realtime view shows your session
- [ ] Events appear in console
- [ ] No errors in browser console

---

## 📖 Full Documentation

See `GOOGLE_ANALYTICS_SETUP.md` for complete guide.

---

**Quick Links:**
- [GA4 Dashboard](https://analytics.google.com/)
- [Realtime View](https://analytics.google.com/analytics/web/#/realtime)
- [Events Report](https://analytics.google.com/analytics/web/#/report/content-event-events)
