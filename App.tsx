import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from './app/components/layout/ErrorBoundary';
import { DataProvider } from './app/contexts/DataContext';
import RootNavigator from './app/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <DataProvider>
          <RootNavigator />
        </DataProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
