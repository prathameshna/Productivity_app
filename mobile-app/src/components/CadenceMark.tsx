import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme/tokens';

export function CadenceMark({ size = 54 }: { size?: number }) {
  const faceSize = size * 0.43;
  return (
    <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.inner, { width: faceSize, height: faceSize, borderRadius: faceSize / 2 }]}>
        <View style={styles.eyeRow}>
          <View style={styles.eye} />
          <View style={styles.eye} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F0EC',
    borderColor: colors.border,
    borderWidth: 1,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#292A27',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  eyeRow: { flexDirection: 'row', gap: 4 },
  eye: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#F5CFA3' },
});
