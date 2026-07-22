import { supabase } from './supabase';

export interface TrafficData {
  session_id: string;
  url: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  user_agent?: string;
  device_type?: string;
}

let sessionId: string | null = null;
let pageViewCount: number = 0;

// Generate or retrieve session ID
export function getSessionId(): string {
  if (!sessionId) {
    sessionId = localStorage.getItem('traffic_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('traffic_session_id', sessionId);
    }
  }
  return sessionId;
}

// Detect device type
export function detectDeviceType(): string {
  const ua = navigator.userAgent;
  if (/mobile|android|iphone|ipad|phone/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
}

// Get UTM parameters from URL
export function getUTMParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_term: params.get('utm_term') || undefined,
    utm_content: params.get('utm_content') || undefined,
  };
}

// Get referrer
export function getReferrer(): string | undefined {
  const referrer = document.referrer;
  if (referrer && referrer !== window.location.href) {
    try {
      const url = new URL(referrer);
      return url.hostname;
    } catch {
      return referrer;
    }
  }
  return undefined;
}

// Track page visit
export async function trackPageVisit(url: string): Promise<void> {
  try {
    const sessionId = getSessionId();
    const utmParams = getUTMParams();
    const referrer = getReferrer();
    const deviceType = detectDeviceType();
    const userAgent = navigator.userAgent;

    console.log('[Traffic Tracking] Tracking page visit:', {
      sessionId,
      url,
      utmParams,
      referrer,
      deviceType,
    });

    // Check if this session already has a visit for this URL
    const { data: existingVisit } = await supabase
      .from('page_visits')
      .select('*')
      .eq('session_id', sessionId)
      .eq('url', url)
      .is('exited_at', null)
      .single();

    if (existingVisit) {
      // Update existing visit (page view count)
      await supabase
        .from('page_visits')
        .update({
          page_views: existingVisit.page_views + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingVisit.id);
    } else {
      // Create new visit
      await supabase.from('page_visits').insert({
        session_id: sessionId,
        url,
        utm_source: utmParams.utm_source,
        utm_medium: utmParams.utm_medium,
        utm_campaign: utmParams.utm_campaign,
        utm_term: utmParams.utm_term,
        utm_content: utmParams.utm_content,
        referrer,
        user_agent: userAgent,
        device_type: deviceType,
      });
    }

    pageViewCount++;
  } catch (error) {
    console.error('[Traffic Tracking] Failed to track page visit:', error);
  }
}

// Track session exit
export async function trackSessionExit(): Promise<void> {
  try {
    const sessionId = getSessionId();
    console.log('[Traffic Tracking] Tracking session exit:', sessionId);

    const { error } = await supabase.rpc('update_session_on_exit', {
      p_session_id: sessionId,
    });

    if (error) {
      console.error('[Traffic Tracking] Failed to update session:', error);
    }
  } catch (error) {
    console.error('[Traffic Tracking] Failed to track session exit:', error);
  }
}

// Get traffic stats from admin
export async function getTrafficStats(startDate?: string, endDate?: string): Promise<any> {
  try {
    const { data, error } = await supabase.rpc('get_traffic_stats_admin', {
      p_auth_pass: 'Robbin#15',
      p_start_date: startDate || null,
      p_end_date: endDate || null,
    });

    if (error) {
      console.error('[Traffic Tracking] Failed to get traffic stats:', error);
      return null;
    }

    return data[0];
  } catch (error) {
    console.error('[Traffic Tracking] Failed to get traffic stats:', error);
    return null;
  }
}

// Get live sessions from admin
export async function getLiveSessions(): Promise<any[]> {
  try {
    const { data, error } = await supabase.rpc('get_live_sessions_admin', {
      p_auth_pass: 'Robbin#15',
    });

    if (error) {
      console.error('[Traffic Tracking] Failed to get live sessions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Traffic Tracking] Failed to get live sessions:', error);
    return [];
  }
}

// Initialize tracking
export function initTrafficTracking(): void {
  console.log('[Traffic Tracking] Initializing...');
  
  // Track initial page load
  trackPageVisit(window.location.pathname);

  // Track page view changes (for SPA)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(history, args);
    setTimeout(() => trackPageVisit(window.location.pathname), 100);
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(history, args);
    setTimeout(() => trackPageVisit(window.location.pathname), 100);
  };

  // Track visibility change (tab switch/close) - more reliable than beforeunload
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      console.log('[Traffic Tracking] Visibility hidden, tracking session exit');
      trackSessionExit();
    }
  });

  // Also track page unload as backup
  window.addEventListener('beforeunload', () => {
    console.log('[Traffic Tracking] Page unloading, tracking session exit');
    trackSessionExit();
  });
}
