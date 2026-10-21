// ============================================================================
// ZENFOCUS ROOT MOBILE APPLICATION
// Role-Gated: First-launch account creation -> Child sees ONLY Child Dashboard,
// Parent sees BOTH Parent Control and Child View.
// ============================================================================

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ZenFocusProvider, useZenFocus } from './src/store/ZenFocusContext';
import { HeaderBar } from './src/components/HeaderBar';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { ChildDashboardScreen } from './src/screens/ChildDashboardScreen';
import { ParentDashboardScreen } from './src/screens/ParentDashboardScreen';
import { InstaSaveAccountPage } from './src/components/InstaSaveAccountPage';
import { Palette } from './src/theme';

const MainAppContent: React.FC = () => {
  const {
    account,
    activeView,
    setActiveView,
    registerAccount,
    signOut,
    themeMode,
    toggleTheme,
    activeParentTab,
    setActiveParentTab,
  } = useZenFocus();

  const theme = Palette[themeMode];

  // If no account is logged in, show the first-launch Role Choice & Account Creation Screen
  if (!account) {
    return (
      <>
        <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
        <WelcomeScreen onRegisterAccount={registerAccount} themeMode={themeMode} />
      </>
    );
  }

  // Once an account exists:
  // - Child account sees ONLY Child Dashboard (Header switcher is hidden)
  // - Parent account can toggle between Control Dashboard, Insta-Save Page, and Child View
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.surface }]}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <HeaderBar
        account={account}
        activeView={activeView}
        onSwitchView={setActiveView}
        activeParentTab={activeParentTab}
        onSwitchParentTab={setActiveParentTab}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
        onSignOut={signOut}
      />
      <View style={[styles.body, { backgroundColor: theme.canvas }]}>
        {activeView === 'CHILD' ? <ChildDashboardScreen /> : <ParentDashboardScreen />}
      </View>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ZenFocusProvider>
        <MainAppContent />
      </ZenFocusProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
});
