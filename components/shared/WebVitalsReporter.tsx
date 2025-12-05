"use client";

import { useEffect } from 'react';
import { onCLS, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';

function sendToAnalytics(metric: Metric) {
  // In production, send to your analytics service
  // Example integrations:
  // - Vercel Analytics: import { track } from '@vercel/analytics'
  // - Google Analytics: gtag('event', metric.name, {...})
  // - Custom endpoint: fetch('/api/analytics', { method: 'POST', body: JSON.stringify(metric) })
  
  if (process.env.NODE_ENV === 'production') {
    // Log to console for now - replace with actual analytics service
    console.log('[Web Vitals]', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
    });
    
    // Example: Send to custom analytics endpoint
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(metric),
    // }).catch(console.error);
  } else {
    // Detailed logging in development
    console.log('[Web Vitals]', {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      rating: metric.rating,
      delta: metric.delta,
    });
  }
}

export function WebVitalsReporter() {
  useEffect(() => {
    onCLS(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
    onINP(sendToAnalytics);
  }, []);

  return null;
}

