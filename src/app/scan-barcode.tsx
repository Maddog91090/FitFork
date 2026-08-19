import { useMemo, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { BackLink } from '../components/ui/BackLink';
import { Button } from '../components/ui/Button';
import { materialTypography, spacing, useMaterialColors, type MaterialColorScheme } from '../theme/tokens';

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'] as const;

export default function ScanBarcodeScreen() {
  const colors = useMaterialColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  // The camera keeps calling onBarcodeScanned every frame a barcode stays in
  // view; this ref guards against pushing the confirmation screen more than once.
  const hasScanned = useRef(false);

  const handleScan = (result: BarcodeScanningResult) => {
    if (hasScanned.current) return;
    hasScanned.current = true;
    router.replace({ pathname: '/log-product', params: { barcode: result.data } });
  };

  if (!permission) {
    return <View style={[styles.screen, { paddingTop: insets.top }]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top }]}>
        <BackLink />
        <Text style={styles.permissionTitle}>Accès à l'appareil photo</Text>
        <Text style={styles.permissionMessage}>
          FitFork a besoin de l'appareil photo pour scanner le code-barres d'un produit.
        </Text>
        <Button title="Autoriser l'appareil photo" onPress={requestPermission} domain="nutrition" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
        onBarcodeScanned={handleScan}
      />
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <BackLink />
        <View style={styles.frame} />
        <Text style={styles.hint}>Vise le code-barres du produit</Text>
      </View>
    </View>
  );
}

function createStyles(colors: MaterialColorScheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
    overlay: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
    frame: {
      alignSelf: 'center',
      width: '80%',
      aspectRatio: 1.6,
      borderWidth: 3,
      borderColor: colors.surface,
      borderRadius: 12,
    },
    hint: {
      ...materialTypography.bodyLarge,
      color: colors.surface,
      textAlign: 'center',
      marginBottom: spacing.xxl,
    },
    permissionTitle: { ...materialTypography.titleLarge, color: colors.onSurface, marginBottom: spacing.sm, textAlign: 'center' },
    permissionMessage: {
      ...materialTypography.bodyLarge,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
  });
}
