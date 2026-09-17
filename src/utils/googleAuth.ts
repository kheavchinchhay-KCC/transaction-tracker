/**
 * Google Sheets authorization for the browser build.
 * Uses Google Identity Services' popup token flow so the SPA stays on its
 * Netlify URL and does not depend on an OAuth redirect URI.
 */

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '890611774799-u07ta2jovf155gnoftipr67aqq1ooroj.apps.googleusercontent.com';

const GOOGLE_SHEETS_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
].join(' ');

let gisLoadPromise: Promise<void> | null = null;

function loadGoogleIdentityServices(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google authorization is only available in a browser.'));
  }

  const w = window as any;
  if (w.google?.accounts?.oauth2) return Promise.resolve();
  if (gisLoadPromise) return gisLoadPromise;

  gisLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity-services]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentityServices = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services.'));
    document.head.appendChild(script);
  });

  return gisLoadPromise;
}

function startGoogleTokenRequest(): Promise<string> {
  const google = (window as any).google;
  if (!google?.accounts?.oauth2?.initTokenClient) {
    throw new Error('Google Identity Services is unavailable. Please refresh the page and try again.');
  }

  return new Promise<string>((resolve, reject) => {
    let settled = false;

    const finishReject = (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(error instanceof Error ? error : new Error(String(error)));
    };

    const client = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_SHEETS_SCOPES,
      include_granted_scopes: true,
      callback: (response: any) => {
        if (response?.error) {
          finishReject(new Error(response.error_description || response.error));
          return;
        }
        if (!response?.access_token) {
          finishReject(new Error('Google did not return an access token.'));
          return;
        }

        settled = true;
        const expiresIn = Number(response.expires_in || 3600);
        const expiryTime = Date.now() + Math.max(60, expiresIn - 60) * 1000;
        localStorage.setItem('google-sheets-token', response.access_token);
        localStorage.setItem('google-sheets-token-expiry', String(expiryTime));
        resolve(response.access_token);
      },
      error_callback: (error: any) => {
        finishReject(new Error(error?.type || 'Google authorization popup failed.'));
      },
    });

    try {
      client.requestAccessToken({ prompt: 'consent' });
    } catch (error) {
      finishReject(error);
    }
  });
}

export function requestGoogleSheetsAccessToken(): Promise<string> {
  // GIS is preloaded by index.html. If it is ready, start immediately from the
  // button click so the browser preserves popup user activation.
  if ((window as any).google?.accounts?.oauth2?.initTokenClient) {
    return startGoogleTokenRequest();
  }

  return loadGoogleIdentityServices().then(startGoogleTokenRequest);
}
