import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import LottieView from 'lottie-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { motion, spacing, typography, useThemeColors, type ThemeColors } from '../theme/tokens';

// LottieFiles "circle ripple effect" (community asset), recolored to the
// app's premiumBronze/premiumBronzeSoft palette — an expanding ring pulse
// behind the mascot on the splash screen, matching the bronze-premium
// direction picked for Home's hero card.
const SPLASH_RIPPLE_SOURCE = require('../../assets/images/mascot/splash-ripple.json');
const MASCOT_SOURCE = require('../../assets/images/mascot/mascot-idle.png');

export default function Index() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { session, loading } = useAuth();
  const [holdElapsed, setHoldElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHoldElapsed(true), motion.duration.splashHold);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && holdElapsed) {
      router.replace(session ? '/home' : '/login');
    }
  }, [loading, holdElapsed, session]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.rippleWrap}>
        <View style={styles.ripple}>
          <LottieView source={SPLASH_RIPPLE_SOURCE} autoPlay loop style={styles.rippleLottie} />
        </View>
        <Image
          source={MASCOT_SOURCE}
          style={styles.mascot}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
      <Text style={styles.title}>FitPro</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgBase },
    rippleWrap: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
    ripple: { position: 'absolute', width: 220, height: 220, pointerEvents: 'none' },
    rippleLottie: { width: '100%', height: '100%' },
    mascot: { width: 120, height: 120 },
    title: { ...typography.hero, color: colors.textPrimary, marginTop: spacing.xl },
  });
}
