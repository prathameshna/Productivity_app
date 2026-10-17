import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/tokens';
import { getNotesStorageError, useNotesStorageStatus } from './notesState';

export default function NotesHomeScreen() {
  const storageStatus = useNotesStorageStatus();
  const storageError = getNotesStorageError();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.title} maxFontSizeMultiplier={1.15}>Notes</Text>
        <Text style={styles.message} maxFontSizeMultiplier={1.15}>
          {storageStatus === 'loading' ? 'Loading your notes…' : storageStatus === 'error' ? storageError : 'Sticky Notes is ready for the next phase.'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  title: { color: colors.ink, fontSize: 24, fontWeight: '600' },
  message: { color: colors.secondary, fontSize: 14, textAlign: 'center', marginTop: 12 },
});
