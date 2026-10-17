import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { parseStorageUrl, getResolvedStorageUrl, resolveStorageUrl } from './storageUrls';

/**
 * Opens a URL in the in-app browser (iOS/Android) or new tab (web)
 * This keeps users within the app experience on mobile
 */
export const openInAppBrowser = async (url) => {
  if (!url) return;

  // Ensure URL has protocol
  let fullUrl = url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    fullUrl = 'https://' + url;
  }

  // Storage files open through a signed URL so they work from a private bucket
  if (parseStorageUrl(fullUrl)) {
    const ready = getResolvedStorageUrl(fullUrl);
    if (ready) {
      fullUrl = ready;
    } else if (!Capacitor.isNativePlatform()) {
      // Web: open the tab now, while the tap still counts, then point it at the file
      const tab = window.open('', '_blank');
      const signed = await resolveStorageUrl(fullUrl);
      if (tab) {
        tab.opener = null;
        tab.location.href = signed;
      } else {
        window.open(signed, '_blank', 'noopener,noreferrer');
      }
      return;
    } else {
      fullUrl = await resolveStorageUrl(fullUrl);
    }
  }

  try {
    if (Capacitor.isNativePlatform()) {
      // Native: Use Capacitor Browser (SFSafariViewController / Chrome Custom Tabs)
      await Browser.open({
        url: fullUrl,
        presentationStyle: 'fullscreen', // iOS: shows as overlay
        toolbarColor: '#224B6E', // RemedyGo brand blue
      });
    } else {
      // Web: Open in new tab
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    }
  } catch (error) {
    console.error('Error opening browser:', error);
    // Fallback to window.open
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  }
};

/**
 * Close the in-app browser (if open)
 */
export const closeInAppBrowser = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.close();
    }
  } catch (error) {
    console.error('Error closing browser:', error);
  }
};
