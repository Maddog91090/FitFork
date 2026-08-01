import { Modal, View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { getExerciseVisual } from '../lib/exerciseVisuals';
import { colors, radius, spacing } from '../theme/tokens';

type ExerciseVisualModalProps = {
  visible: boolean;
  exerciseName: string | null;
  onClose: () => void;
};

export function ExerciseVisualModal({ visible, exerciseName, onClose }: ExerciseVisualModalProps) {
  const visual = exerciseName ? getExerciseVisual(exerciseName) : undefined;

  if (!visual) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>{visual.label}</Text>
          <View style={styles.imageRow}>
            <View style={styles.imageBlock}>
              <Image source={visual.start} style={styles.image} resizeMode="contain" />
              <Text style={styles.imageLabel}>Départ</Text>
            </View>
            <View style={styles.imageBlock}>
              <Image source={visual.end} style={styles.image} resizeMode="contain" />
              <Text style={styles.imageLabel}>Fin</Text>
            </View>
          </View>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 420,
  },
  title: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md },
  imageRow: { flexDirection: 'row', gap: spacing.md },
  imageBlock: { flex: 1, alignItems: 'center' },
  image: { width: '100%', aspectRatio: 1, backgroundColor: colors.bgBase, borderRadius: radius.sm },
  imageLabel: { marginTop: spacing.xs, fontSize: 12, color: colors.textSecondary },
  closeButton: {
    marginTop: spacing.lg,
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.bgBase,
  },
  closeButtonText: { color: colors.textPrimary, fontWeight: '700', fontSize: 13 },
});
