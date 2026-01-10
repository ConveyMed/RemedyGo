import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.conveyProInc.curvaFixSalesEngagement',
  appName: 'RemedyGo',
  webDir: 'build',
  ios: {
    contentInset: 'never',
    backgroundColor: '#FFFFFF'
  },
  android: {
    backgroundColor: '#FFFFFF'
  },
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      backgroundColor: '#FFFFFF',
      launchAutoHide: true,
      androidScaleType: 'CENTER_INSIDE'
    }
  }
};

export default config;
