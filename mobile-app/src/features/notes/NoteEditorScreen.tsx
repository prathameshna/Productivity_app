import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { notesColors, notesRadii } from '@/theme/notesTokens';
import { createNote, deleteNote, getNotesStorageError, updateNote, useNotes, useNotesStorageStatus } from './notesState';

const DEBOUNCE_MS = 400;

export default function NoteEditorScreen() {
  const { id: routeId } = useLocalSearchParams<{ id?: string }>();
  const isNewRoute = !routeId || routeId === 'new';
  const decodedId = isNewRoute ? null : decodeURIComponent(routeId);
  const notes = useNotes();
  const storageStatus = useNotesStorageStatus();
  const storageError = getNotesStorageError();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const existing = decodedId ? notes.find((note) => note.id === decodedId) : undefined;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [content, setContent] = useState(existing?.content ?? '');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const draftRef = useRef({ title, content });
  const noteIdRef = useRef<string | null>(decodedId);
  const hasEditedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canLeaveRef = useRef(false);
  const savingRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (!decodedId || hasEditedRef.current || !existing) return;
    draftRef.current = { title: existing.title, content: existing.content };
    setTitle(existing.title);
    setContent(existing.content);
  }, [decodedId, existing]);

  const saveDraft = useCallback(async () => {
    if (savingRef.current) await savingRef.current;
    const draft = draftRef.current;
    if (!draft.title.trim() && !draft.content.trim()) return;
    setSaving(true);
    setSaveError(null);
    const operation = (async () => {
      if (noteIdRef.current) {
        await updateNote(noteIdRef.current, draft);
      } else {
        const created = await createNote(draft);
        noteIdRef.current = created.id;
      }
    })();
    savingRef.current = operation;
    try {
      await operation;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Your note could not be saved.');
      throw error;
    } finally {
      savingRef.current = null;
      setSaving(false);
    }
  }, []);

  const saveDraftRef = useRef(saveDraft);
  saveDraftRef.current = saveDraft;

  const queueSave = useCallback((next: { title: string; content: string }) => {
    draftRef.current = next;
    hasEditedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void saveDraftRef.current().catch(() => {});
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'inactive' || state === 'background') {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
        void saveDraftRef.current().catch(() => {});
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (canLeaveRef.current || !hasEditedRef.current) return;
      event.preventDefault();
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      void saveDraftRef.current().then(() => {
        canLeaveRef.current = true;
        navigation.dispatch(event.data.action);
      }).catch(() => {});
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (hasEditedRef.current) void saveDraftRef.current().catch(() => {});
  }, []);

  const handleTitleChange = useCallback((nextTitle: string) => {
    setTitle(nextTitle);
    queueSave({ ...draftRef.current, title: nextTitle });
  }, [queueSave]);
  const handleContentChange = useCallback((nextContent: string) => {
    setContent(nextContent);
    queueSave({ ...draftRef.current, content: nextContent });
  }, [queueSave]);
  const handleDelete = useCallback(() => {
    if (!noteIdRef.current) { router.back(); return; }
    Alert.alert('Delete note?', 'This note will be removed from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        void deleteNote(noteIdRef.current!).then(() => router.back()).catch((error: unknown) => {
          setSaveError(error instanceof Error ? error.message : 'The note could not be deleted.');
        });
      } },
    ]);
  }, [router]);

  const noteIsMissing = !isNewRoute && storageStatus !== 'loading' && !existing;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to notes" onPress={() => router.back()} style={styles.headerButton}>
            <ArrowLeft size={23} color={notesColors.ink} />
          </Pressable>
          <Text style={styles.headerTitle} maxFontSizeMultiplier={1.15}>{isNewRoute ? 'New note' : 'Edit note'}</Text>
          {isNewRoute ? <View style={styles.headerButton} /> : <Pressable accessibilityRole="button" accessibilityLabel="Delete note" onPress={handleDelete} style={styles.headerButton}>
            <Trash2 size={20} color={notesColors.muted} />
          </Pressable>}
        </View>

        {storageStatus === 'loading' ? <View style={styles.state}><Text style={styles.stateText} maxFontSizeMultiplier={1.15}>Loading your note…</Text></View> : noteIsMissing ? <View style={styles.state}><Text style={styles.stateText} maxFontSizeMultiplier={1.15}>This note could not be found.</Text></View> : (
          <ScrollView contentContainerStyle={[styles.editorContent, { paddingBottom: 28 + insets.bottom }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
            {(saveError || storageStatus === 'error') ? <View accessibilityRole="alert" style={styles.error}><Text style={styles.errorText} maxFontSizeMultiplier={1.15}>{saveError ?? storageError ?? 'Notes storage is unavailable.'}</Text></View> : null}
            <TextInput value={title} onChangeText={handleTitleChange} placeholder="Title" placeholderTextColor={notesColors.muted} style={styles.titleInput} accessibilityLabel="Note title" maxFontSizeMultiplier={1.15} returnKeyType="next" blurOnSubmit={false} onSubmitEditing={() => undefined} />
            <TextInput value={content} onChangeText={handleContentChange} placeholder="Write a note…" placeholderTextColor={notesColors.muted} style={styles.contentInput} accessibilityLabel="Note content" multiline textAlignVertical="top" maxFontSizeMultiplier={1.15} scrollEnabled={false} />
            <View style={styles.footer}>
              <Text style={styles.footerText} maxFontSizeMultiplier={1.15}>{saving ? 'Saving…' : saveError || storageStatus === 'error' ? 'Not saved' : hasEditedRef.current ? 'Saved on this device' : 'Stored on this device'}</Text>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: notesColors.background },
  screen: { flex: 1, backgroundColor: notesColors.background },
  header: { height: 56, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  headerTitle: { color: notesColors.ink, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16 },
  editorContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20 },
  titleInput: { minHeight: 52, color: notesColors.ink, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 23, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: notesColors.cardBorder, borderRadius: notesRadii.input, backgroundColor: '#FFFFFF' },
  contentInput: { minHeight: 240, marginTop: 14, padding: 14, borderWidth: 1, borderColor: notesColors.cardBorder, borderRadius: notesRadii.input, backgroundColor: '#FFFFFF', color: notesColors.ink, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 16, lineHeight: 25 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  footerText: { color: notesColors.muted, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12 },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateText: { color: notesColors.muted, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, textAlign: 'center' },
  error: { padding: 12, borderRadius: 10, backgroundColor: '#FFEBE9', marginBottom: 14 },
  errorText: { color: notesColors.error, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 },
});
