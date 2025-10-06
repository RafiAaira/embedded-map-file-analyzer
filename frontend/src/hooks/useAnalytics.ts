import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';

/**
 * Google Analytics 4 Hook
 *
 * Initializes GA4 and provides event tracking functionality.
 * Automatically tracks page views when route changes.
 */

// Initialize GA4 with Measurement ID from environment variable
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const IS_PRODUCTION = import.meta.env.PROD;
const IS_GA_ENABLED = GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX';

// Initialize GA4 once
let isInitialized = false;

export function initializeGA() {
  if (isInitialized || !IS_GA_ENABLED) return;

  try {
    ReactGA.initialize(GA_MEASUREMENT_ID, {
      testMode: !IS_PRODUCTION, // Enable test mode in development
      gtagOptions: {
        send_page_view: false, // We'll handle page views manually
      },
    });
    isInitialized = true;
    console.log('✅ Google Analytics initialized:', GA_MEASUREMENT_ID);
  } catch (error) {
    console.error('❌ Failed to initialize Google Analytics:', error);
  }
}

/**
 * Custom Events for Embedded Map File Analyzer
 */
export type AnalyticsEvent =
  | { name: 'file_upload'; params: { file_size?: number; file_type?: string } }
  | { name: 'comparison_done'; params: { build1_size?: number; build2_size?: number; size_diff?: number } }
  | { name: 'export_report'; params: { format: 'pdf' | 'csv' | 'json'; section?: string } }
  | { name: 'analysis_complete'; params: { sections_count?: number; total_size?: number } }
  | { name: 'tab_change'; params: { tab: string } }
  | { name: 'section_clicked'; params: { section_name?: string } }
  | { name: 'mock_data_toggled'; params: { enabled: boolean } }
  | { name: 'anomaly_detected'; params: { anomaly_type?: string; severity?: string } };

/**
 * Track a custom event
 */
export function trackEvent(event: AnalyticsEvent) {
  if (!IS_GA_ENABLED) {
    console.log('🔍 [Analytics - Dev Mode]', event.name, event.params);
    return;
  }

  try {
    ReactGA.event(event.name, event.params);
    console.log('📊 Event tracked:', event.name, event.params);
  } catch (error) {
    console.error('❌ Failed to track event:', error);
  }
}

/**
 * Track a page view
 */
export function trackPageView(path: string, title?: string) {
  if (!IS_GA_ENABLED) {
    console.log('🔍 [Analytics - Dev Mode] Page view:', path, title);
    return;
  }

  try {
    ReactGA.send({
      hitType: 'pageview',
      page: path,
      title: title || document.title,
    });
    console.log('📄 Page view tracked:', path);
  } catch (error) {
    console.error('❌ Failed to track page view:', error);
  }
}

/**
 * Hook to automatically track page views on route changes
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    const path = location.pathname + location.search;
    trackPageView(path);
  }, [location]);
}

/**
 * Main Analytics Hook
 *
 * Usage:
 * ```tsx
 * const analytics = useAnalytics();
 *
 * // Track custom event
 * analytics.trackEvent({
 *   name: 'file_upload',
 *   params: { file_size: 12345, file_type: 'map' }
 * });
 * ```
 */
export function useAnalytics() {
  // Initialize GA on first use
  useEffect(() => {
    initializeGA();
  }, []);

  return {
    trackEvent,
    trackPageView,
    isEnabled: IS_GA_ENABLED,
    measurementId: GA_MEASUREMENT_ID,
  };
}

/**
 * Helper functions for common tracking scenarios
 */
export const Analytics = {
  /**
   * Track file upload
   */
  trackFileUpload(fileSize?: number, fileType: string = 'map') {
    trackEvent({
      name: 'file_upload',
      params: { file_size: fileSize, file_type: fileType },
    });
  },

  /**
   * Track build comparison
   */
  trackComparison(build1Size?: number, build2Size?: number, sizeDiff?: number) {
    trackEvent({
      name: 'comparison_done',
      params: {
        build1_size: build1Size,
        build2_size: build2Size,
        size_diff: sizeDiff,
      },
    });
  },

  /**
   * Track report export
   */
  trackExport(format: 'pdf' | 'csv' | 'json', section?: string) {
    trackEvent({
      name: 'export_report',
      params: { format, section },
    });
  },

  /**
   * Track analysis completion
   */
  trackAnalysis(sectionsCount?: number, totalSize?: number) {
    trackEvent({
      name: 'analysis_complete',
      params: { sections_count: sectionsCount, total_size: totalSize },
    });
  },

  /**
   * Track tab change
   */
  trackTabChange(tab: string) {
    trackEvent({
      name: 'tab_change',
      params: { tab },
    });
  },

  /**
   * Track section click
   */
  trackSectionClick(sectionName?: string) {
    trackEvent({
      name: 'section_clicked',
      params: { section_name: sectionName },
    });
  },

  /**
   * Track mock data toggle
   */
  trackMockDataToggle(enabled: boolean) {
    trackEvent({
      name: 'mock_data_toggled',
      params: { enabled },
    });
  },

  /**
   * Track anomaly detection
   */
  trackAnomaly(anomalyType?: string, severity?: string) {
    trackEvent({
      name: 'anomaly_detected',
      params: { anomaly_type: anomalyType, severity },
    });
  },
};
