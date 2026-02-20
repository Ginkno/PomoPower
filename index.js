import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

// Platform-specific entry points
// This ensures we use the correct app implementation for each platform
let App;

if (Platform.OS === 'web') {
  // For web - use the web-specific implementation
  App = require('./web/AppWeb').default;
} else {
  // For iOS and Android - use the native implementation
  App = require('./mobile/App').default;
}

// Register the appropriate component
registerRootComponent(App);
