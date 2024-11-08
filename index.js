// index.js
import 'expo-dev-client';
import { registerRootComponent } from 'expo';
import App from './App';
import { useEffect } from 'react';
import { GoogleMobileAds } from 'react-native-google-mobile-ads';

function Root() {
    useEffect(() => {
        GoogleMobileAds.initialize()
            .then(adapterStatuses => {
                console.log('Google Mobile Ads initialized', adapterStatuses);
            })
            .catch(error => {
                console.error('Google Mobile Ads initialization error:', error);
            });
    }, []);

    return <App />;
}

registerRootComponent(Root);
