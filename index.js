// index.js
import 'expo-dev-client';
import { registerRootComponent } from 'expo';
import App from './App';
import React, { useEffect } from 'react';
import { GoogleMobileAds } from 'react-native-google-mobile-ads';

registerRootComponent(App);
