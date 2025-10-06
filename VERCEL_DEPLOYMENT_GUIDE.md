# Vercel Deployment Guide

## 🚀 Deploy Embedded Map File Analyzer to Vercel

This guide will help you deploy both the frontend and backend to Vercel.

---

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com/)
2. **GitHub Repository**: Push your code to GitHub
3. **GA4 Measurement ID**: Get from Google Analytics (optional)

---

## 🎯 Deployment Options

### **Option 1: Deploy Frontend Only (Recommended for now)**

Since the backend requires file uploads and processing, we'll deploy just the frontend first. The frontend can work standalone with mock data.

### **Option 2: Deploy Full Stack**

Deploy both frontend and backend as separate Vercel projects.

---

## 📦 Option 1: Frontend-Only Deployment

### **Step 1: Prepare Your Repository**

```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### **Step 2: Deploy to Vercel**

#### **Method A: Vercel CLI (Fastest)**

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? embedded-map-analyzer
# - Directory? ./
# - Override settings? No
```

#### **Method B: Vercel Dashboard (Easier)**

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository**
   - Click "Add New Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install --legacy-peer-deps
   ```

4. **Add Environment Variables**
   - Click "Environment Variables"
   - Add:
     ```
     VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
     VITE_APP_NAME=Embedded Map File Analyzer
     VITE_APP_VERSION=1.0.0
     ```

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Get your URL: `https://your-project.vercel.app`

---

## 🔧 Configuration Files

I've created these configuration files:

### **Root `vercel.json`**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build"
    }
  ]
}
```

### **Frontend `vercel.json`**
- Configures SPA routing
- Sets security headers
- Enables asset caching

---

## 🌐 Custom Domain Setup

### **Add Custom Domain**

1. Go to your Vercel project
2. Click **Settings** → **Domains**
3. Add your domain:
   ```
   embedded-map-analyzer.com
   www.embedded-map-analyzer.com
   ```

4. Update DNS records (provided by Vercel)

5. Wait for SSL certificate (automatic)

### **Update SEO Files**

After getting your domain, update these files:

**`frontend/src/components/SEO.tsx`** (Line 10):
```typescript
url = 'https://embedded-map-analyzer.com',
```

**`frontend/public/sitemap.xml`**:
```xml
<loc>https://embedded-map-analyzer.com/</loc>
```

**`frontend/public/robots.txt`**:
```
Sitemap: https://embedded-map-analyzer.com/sitemap.xml
```

Then commit and push:
```bash
git add .
git commit -m "Update domain URLs"
git push
```

Vercel will auto-deploy!

---

## 📊 Option 2: Full Stack Deployment

### **Deploy Backend Separately**

1. **Create New Vercel Project for Backend**
   ```bash
   cd backend
   vercel
   ```

2. **Configure Backend**
   ```
   Framework: Other
   Root Directory: backend
   Build Command: (leave empty)
   Output Directory: (leave empty)
   ```

3. **Get Backend URL**
   ```
   https://your-backend.vercel.app
   ```

4. **Update Frontend to Use Backend URL**

   Edit `frontend/.env`:
   ```env
   VITE_API_URL=https://your-backend.vercel.app
   ```

5. **Update FileUploader Component**

   Edit `frontend/src/components/FileUploader.tsx`:
   ```typescript
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

   const response = await fetch(`${API_URL}/analyze`, {
     method: 'POST',
     body: formData,
   });
   ```

6. **Redeploy Frontend**
   ```bash
   cd frontend
   vercel --prod
   ```

---

## ✅ Post-Deployment Checklist

### **Verify Deployment**

- [ ] Site loads at Vercel URL
- [ ] All routes work (/, /analysis-report, /comparison-report)
- [ ] PWA installs correctly
- [ ] Mock data loads
- [ ] Google Analytics tracking works
- [ ] SEO meta tags visible (View Page Source)
- [ ] No console errors

### **Test Features**

- [ ] Tab switching (Analyze / Compare)
- [ ] Mock data toggle
- [ ] Export CSV/JSON
- [ ] Print/PDF report
- [ ] Dark mode toggle
- [ ] Mobile responsive

### **SEO Verification**

- [ ] robots.txt accessible: `https://your-site.vercel.app/robots.txt`
- [ ] sitemap.xml accessible: `https://your-site.vercel.app/sitemap.xml`
- [ ] manifest.json accessible: `https://your-site.vercel.app/manifest.json`
- [ ] Open Graph tags in HTML source
- [ ] Structured data present

### **Submit to Search Engines**

1. **Google Search Console**
   - Add property: your Vercel URL
   - Verify ownership
   - Submit sitemap

2. **Bing Webmaster Tools**
   - Add site
   - Submit sitemap

---

## 🔐 Environment Variables

### **Required**

```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### **Optional**

```env
VITE_APP_NAME=Embedded Map File Analyzer
VITE_APP_VERSION=1.0.0
VITE_API_URL=https://your-backend.vercel.app
```

### **Add in Vercel Dashboard**

1. Go to project **Settings**
2. Click **Environment Variables**
3. Add each variable
4. Select environment: Production, Preview, Development
5. Click **Save**
6. Redeploy for changes to take effect

---

## 🚨 Common Issues & Fixes

### **Issue: Build Fails**

**Error:** `npm install failed`

**Fix:**
```bash
# In Vercel Dashboard → Settings → General
Install Command: npm install --legacy-peer-deps
```

### **Issue: 404 on Routes**

**Error:** `/analysis-report` returns 404

**Fix:** Already configured in `frontend/vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### **Issue: Environment Variables Not Working**

**Error:** GA not initializing

**Fix:**
1. Check variable name starts with `VITE_`
2. Redeploy after adding variables
3. Clear browser cache

### **Issue: Icons Missing**

**Error:** Favicon not showing

**Fix:** Add icon files to `frontend/public/`:
- favicon-16x16.png
- favicon-32x32.png
- apple-touch-icon.png
- icon-192x192.png
- icon-512x512.png

---

## 📈 Performance Optimization

### **Vercel Edge Network**

Your app is automatically deployed to Vercel's global CDN:
- ✅ 100+ edge locations worldwide
- ✅ Automatic SSL/HTTPS
- ✅ DDoS protection
- ✅ Instant cache invalidation

### **Build Optimizations**

Already configured in `vite.config.ts`:
- ✅ Code splitting
- ✅ Minification
- ✅ Tree shaking
- ✅ Asset optimization

### **Caching Strategy**

Configured in `frontend/vercel.json`:
```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## 🔄 Continuous Deployment

### **Automatic Deployments**

Vercel automatically deploys when you push to GitHub:

- **Production**: Push to `main` branch
- **Preview**: Push to any other branch
- **Development**: Local testing

### **Deployment Workflow**

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Vercel auto-deploys in ~2 minutes
# Get notification email with preview URL
```

---

## 📱 PWA Installation

### **Desktop**

1. Visit your Vercel URL
2. Look for install icon in address bar
3. Click "Install"

### **Mobile (Android)**

1. Visit your Vercel URL
2. Tap browser menu
3. Tap "Install App" or "Add to Home Screen"

### **Mobile (iOS)**

1. Visit your Vercel URL in Safari
2. Tap Share button
3. Tap "Add to Home Screen"

---

## 🔍 Monitoring & Analytics

### **Vercel Analytics**

Enable in Vercel Dashboard:
1. Go to **Analytics** tab
2. Enable Web Analytics
3. View real-time metrics

### **Google Analytics**

Already configured! Events tracked:
- Page views
- File uploads
- Comparisons
- Exports
- Tab changes

---

## 🎨 Branding & Assets

### **Before Production**

1. **Create Favicons**
   - Use [Real Favicon Generator](https://realfavicongenerator.net/)
   - Upload 512x512 logo
   - Download and extract to `frontend/public/`

2. **Create Social Preview**
   - Size: 1200x630px
   - Save as `og-image.png`
   - Place in `frontend/public/`

3. **Update Manifest**
   - Edit `frontend/public/manifest.json`
   - Add screenshots

---

## 📄 Deployment Logs

### **View Build Logs**

1. Go to Vercel Dashboard
2. Click your project
3. Click **Deployments**
4. Click any deployment
5. View **Build Logs** and **Function Logs**

### **Debug Build Issues**

```bash
# Test build locally first
cd frontend
npm run build

# If successful, should create dist/ folder
# If errors, fix them before deploying
```

---

## 🚀 Go Live Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables added
- [ ] First deployment successful
- [ ] Custom domain added (optional)
- [ ] SSL certificate active
- [ ] Icons and images added
- [ ] SEO URLs updated
- [ ] Google Analytics configured
- [ ] Search Console setup
- [ ] PWA installs correctly
- [ ] All features tested
- [ ] Performance tested (Lighthouse)
- [ ] Mobile responsive verified
- [ ] Analytics tracking verified

---

## 🎉 Your App is Live!

**Vercel URL:** `https://your-project.vercel.app`

**Features:**
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Continuous deployment
- ✅ Preview deployments
- ✅ Analytics
- ✅ PWA support
- ✅ SEO optimized
- ✅ Google Analytics

---

## 📞 Support

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Discord**: https://vercel.com/discord
- **Vite Docs**: https://vitejs.dev/
- **React Router**: https://reactrouter.com/

---

## 🔄 Update Deployment

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Vercel auto-deploys
# View at: https://vercel.com/dashboard
```

---

**Version:** 1.0.0
**Last Updated:** 2025-10-06
**Status:** ✅ Ready to Deploy
