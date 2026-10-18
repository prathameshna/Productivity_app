import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Check, Image as ImageIcon, ListChecks, Mic, MoreVertical, Palette, Pencil, Redo2, Share2, Smile, Undo2 } from 'lucide-react-native';
import { noteEditorColors, notesColors } from '@/theme/notesTokens';
import { createNote, deleteNote, getNotesStorageError, updateNote, useNotes, useNotesStorageStatus, type NoteCategory, type NoteColor } from './notesState';

const DEBOUNCE_MS = 400;
const categories: NoteCategory[] = ['Home', 'Work', 'Bookmark', 'Reminder'];
const placeholder = noteEditorColors.placeholder;
const colorChoices: { name: string; value: NoteColor }[] = [
  { name: 'Parchment', value: 'parchment' }, { name: 'Rose', value: 'rose' },
  { name: 'Sage', value: 'sage' }, { name: 'Sky', value: 'sky' },
];

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
  const [category, setCategory] = useState<NoteCategory>(existing?.category ?? 'Home');
  const [color, setColor] = useState<NoteColor>(existing?.color ?? 'parchment');
  const [bodySize, setBodySize] = useState(18);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const draftRef = useRef({ title, content, category, color });
  const historyRef = useRef([{ title, content }]);
  const historyIndexRef = useRef(0);
  const noteIdRef = useRef<string | null>(decodedId);
  const hasEditedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canLeaveRef = useRef(false);
  const savingRef = useRef<Promise<void> | null>(null);
  const bodyInputRef = useRef<TextInput>(null);
  const selectionRef = useRef({ start: 0, end: 0 });

  useEffect(() => {
    if (!decodedId || hasEditedRef.current || !existing) return;
    draftRef.current = { title: existing.title, content: existing.content, category: existing.category, color: existing.color };
    historyRef.current = [{ title: existing.title, content: existing.content }];
    setTitle(existing.title); setContent(existing.content); setCategory(existing.category); setColor(existing.color);
  }, [decodedId, existing]);

  const saveDraft = useCallback(async () => {
    if (savingRef.current) await savingRef.current;
    const draft = draftRef.current;
    if (!draft.title.trim() && !draft.content.trim()) return;
    setSaving(true); setSaveError(null);
    const operation = (async () => {
      if (noteIdRef.current) await updateNote(noteIdRef.current, draft);
      else noteIdRef.current = (await createNote(draft)).id;
    })();
    savingRef.current = operation;
    try { await operation; }
    catch (error) { setSaveError(error instanceof Error ? error.message : 'Your note could not be saved.'); throw error; }
    finally { savingRef.current = null; setSaving(false); }
  }, []);
  const saveDraftRef = useRef(saveDraft);
  saveDraftRef.current = saveDraft;

  const queueSave = useCallback((next: typeof draftRef.current, trackHistory = false) => {
    draftRef.current = next; hasEditedRef.current = true;
    if (trackHistory) {
      const history = historyRef.current.slice(0, historyIndexRef.current + 1);
      history.push({ title: next.title, content: next.content });
      historyRef.current = history.slice(-80); historyIndexRef.current = historyRef.current.length - 1;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { timerRef.current = null; void saveDraftRef.current().catch(() => {}); }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'inactive' || state === 'background') {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null; void saveDraftRef.current().catch(() => {});
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
      void saveDraftRef.current().then(() => { canLeaveRef.current = true; navigation.dispatch(event.data.action); }).catch(() => {});
    });
    return unsubscribe;
  }, [navigation]);
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (hasEditedRef.current) void saveDraftRef.current().catch(() => {});
  }, []);

  const updateText = useCallback((field: 'title' | 'content', value: string) => {
    const next = { ...draftRef.current, [field]: value };
    if (field === 'title') setTitle(value); else setContent(value);
    queueSave(next, true);
  }, [queueSave]);
  const setMetadata = useCallback((patch: Partial<Pick<typeof draftRef.current, 'category' | 'color'>>) => {
    const next = { ...draftRef.current, ...patch };
    if (patch.category) setCategory(patch.category);
    if (patch.color) setColor(patch.color);
    queueSave(next);
  }, [queueSave]);

  const backToNotes = useCallback(async () => {
    Keyboard.dismiss();
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    try { await saveDraftRef.current(); canLeaveRef.current = true; router.back(); }
    catch { /* The on-screen error explains that saving failed; stay in the editor. */ }
  }, [router]);
  const handleDelete = useCallback(() => {
    if (!noteIdRef.current) { router.back(); return; }
    Alert.alert('Delete note?', 'This note will be removed from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        void deleteNote(noteIdRef.current!).then(() => { canLeaveRef.current = true; router.back(); }).catch((error: unknown) => setSaveError(error instanceof Error ? error.message : 'The note could not be deleted.'));
      } },
    ]);
  }, [router]);
  const replaceText = useCallback((insert: string) => {
    const { start, end } = selectionRef.current;
    const nextContent = `${content.slice(0, start)}${insert}${content.slice(end)}`;
    updateText('content', nextContent);
    requestAnimationFrame(() => bodyInputRef.current?.setNativeProps({ selection: { start: start + insert.length, end: start + insert.length } }));
  }, [content, updateText]);
  const undo = useCallback((direction: -1 | 1) => {
    const nextIndex = historyIndexRef.current + direction;
    if (nextIndex < 0 || nextIndex >= historyRef.current.length) return;
    historyIndexRef.current = nextIndex;
    const snapshot = historyRef.current[nextIndex];
    setTitle(snapshot.title); setContent(snapshot.content);
    queueSave({ ...draftRef.current, ...snapshot });
  }, [queueSave]);
  const showCategory = useCallback(() => Alert.alert('Category', undefined, [...categories.map((value) => ({ text: value, onPress: () => setMetadata({ category: value }) })), { text: 'Cancel', style: 'cancel' }]), [setMetadata]);
  const showColors = useCallback(() => Alert.alert('Background style', undefined, [...colorChoices.map(({ name, value }) => ({ text: name, onPress: () => setMetadata({ color: value }) })), { text: 'Cancel', style: 'cancel' }]), [setMetadata]);
  const showMore = useCallback(() => Alert.alert('More Options', undefined, [
    { text: 'Change category', onPress: showCategory }, { text: 'Delete note', style: 'destructive', onPress: handleDelete }, { text: 'Cancel', style: 'cancel' },
  ]), [handleDelete, showCategory]);
  const showTemplate = useCallback(() => Alert.alert('Templates', 'Choose a starting point for this note.', [
    { text: 'Daily journal', onPress: () => replaceText('Today\'s highlight\n\nHow I feel\n\nOne thing to remember:') },
    { text: 'Cancel', style: 'cancel' },
  ]), [replaceText]);
  const shareNote = useCallback(() => {
    const text = [title.trim(), content.trim()].filter(Boolean).join('\n\n');
    if (!text) { Alert.alert('Nothing to share', 'Add some text to this note first.'); return; }
    void Share.share({ message: text }).catch(() => setSaveError('The note could not be shared.'));
  }, [content, title]);
  const noteIsMissing = !isNewRoute && storageStatus !== 'loading' && !existing;
  const dateLabel = (existing?.updatedAt ? new Date(existing.updatedAt) : new Date()).toLocaleString([], { weekday: undefined, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: backgroundFor(color) }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={[styles.screen, { backgroundColor: backgroundFor(color) }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Done" onPress={() => void backToNotes()} style={styles.doneButton}><Check size={28} color={notesColors.ink} strokeWidth={2.2} /></Pressable>
          <View style={styles.actions}>
            <IconButton label="Undo" onPress={() => undo(-1)}><Undo2 size={23} color={notesColors.ink} /></IconButton>
            <IconButton label="Redo" onPress={() => undo(1)}><Redo2 size={23} color={notesColors.ink} /></IconButton>
            <IconButton label="Share" onPress={() => void shareNote()}><Share2 size={23} color={notesColors.ink} /></IconButton>
            <Pressable accessibilityRole="button" accessibilityLabel="More Options" onPress={showMore} style={styles.moreButton}><MoreVertical size={24} color={notesColors.ink} /><View style={styles.notificationDot} /></Pressable>
          </View>
        </View>
        {noteIsMissing ? <View style={styles.state}><Text style={styles.stateText} maxFontSizeMultiplier={1.15}>This note could not be found.</Text></View> : <>
          <View style={styles.metadata}>
            <Text style={styles.timestamp} maxFontSizeMultiplier={1.15}>{dateLabel}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Choose category, current ${category}`} onPress={showCategory} style={styles.categoryButton} />
          </View>
          <ScrollView style={styles.editorScroll} contentContainerStyle={[styles.editorContent, { paddingBottom: 32 + insets.bottom }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
            {(saveError || storageStatus === 'error') ? <View accessibilityRole="alert" style={styles.error}><Text style={styles.errorText} maxFontSizeMultiplier={1.15}>{saveError ?? storageError ?? 'Notes storage is unavailable.'}</Text></View> : null}
            <TextInput value={title} onChangeText={(value) => updateText('title', value)} placeholder="Title" placeholderTextColor={placeholder} style={styles.titleInput} accessibilityLabel="Note title" maxFontSizeMultiplier={1.15} returnKeyType="next" blurOnSubmit={false} onSubmitEditing={() => bodyInputRef.current?.focus()} />
            <TextInput ref={bodyInputRef} value={content} onChangeText={(value) => updateText('content', value)} onSelectionChange={(event) => { selectionRef.current = event.nativeEvent.selection; }} placeholder="Note here or select from Templates" placeholderTextColor={placeholder} style={[styles.contentInput, { fontSize: bodySize }]} accessibilityLabel="Note content" multiline textAlignVertical="top" maxFontSizeMultiplier={1.15} scrollEnabled={false} />
            {!content ? <Pressable accessibilityRole="button" accessibilityLabel="Select from Templates" onPress={showTemplate} style={styles.templateLink}><Text style={styles.templateText} maxFontSizeMultiplier={1.15}>select from Templates</Text></Pressable> : null}
            <Text style={styles.saveStatus} maxFontSizeMultiplier={1.15}>{saving ? 'Saving…' : saveError || storageStatus === 'error' ? 'Not saved' : hasEditedRef.current ? 'Saved on this device' : 'Stored on this device'}</Text>
          </ScrollView>
          <ScrollView horizontal style={[styles.toolbarScroll, { marginBottom: Math.max(12, insets.bottom) }]} contentContainerStyle={styles.toolbar} showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" accessibilityLabel="Editor Formatting Toolbar">
            <ToolbarButton label="Text Formatting" onPress={() => Alert.alert('Text formatting', undefined, [{ text: 'Body', onPress: () => setBodySize(18) }, { text: 'Compact', onPress: () => setBodySize(16) }, { text: 'Cancel', style: 'cancel' }])}><Text style={styles.aa}>Aa</Text></ToolbarButton>
            <ToolbarButton label="Insert Checklist" onPress={() => replaceText('☐ ')}><ListChecks size={23} color={notesColors.ink} strokeWidth={1.9} /></ToolbarButton>
            <ToolbarButton label="Voice Memo" onPress={() => Alert.alert('Voice memo unavailable', 'Audio recording is not enabled in this build. Your note was not changed.')}><Mic size={23} color={notesColors.ink} strokeWidth={1.9} /></ToolbarButton>
            <ToolbarButton label="Draw or Sketch" onPress={() => Alert.alert('Drawing unavailable', 'A drawing canvas is not enabled in this build. Your note was not changed.')}><Pencil size={23} color={notesColors.ink} strokeWidth={1.9} /></ToolbarButton>
            <ToolbarButton label="Add Image" onPress={() => Alert.alert('Image attachment unavailable', 'Image attachment storage is not enabled in this build. Your note was not changed.')}><ImageIcon size={23} color={notesColors.ink} strokeWidth={1.9} /></ToolbarButton>
            <ToolbarButton label="Insert Emoji" onPress={() => Alert.alert('Insert emoji', undefined, [{ text: '😊', onPress: () => replaceText('😊') }, { text: '✨', onPress: () => replaceText('✨') }, { text: '❤️', onPress: () => replaceText('❤️') }, { text: '🎯', onPress: () => replaceText('🎯') }, { text: '🌿', onPress: () => replaceText('🌿') }, { text: 'Cancel', style: 'cancel' }])}><Smile size={23} color={notesColors.ink} strokeWidth={1.9} /></ToolbarButton>
            <ToolbarButton label="Background Styles" onPress={showColors}><Palette size={23} color={notesColors.ink} strokeWidth={1.9} /></ToolbarButton>
          </ScrollView>
        </>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function IconButton({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.actionButton}>{children}</Pressable>;
}
function ToolbarButton({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.toolButton}>{children}</Pressable>;
}
function backgroundFor(color: NoteColor) {
  return ({ parchment: noteEditorColors.background, rose: noteEditorColors.rose, sage: noteEditorColors.sage, sky: noteEditorColors.sky } as const)[color];
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: noteEditorColors.background }, screen: { flex: 1, backgroundColor: noteEditorColors.background },
  header: { height: 60, paddingHorizontal: 20, paddingTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  doneButton: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 7 }, actionButton: { width: 34, height: 44, alignItems: 'center', justifyContent: 'center' },
  moreButton: { width: 30, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -5 }, notificationDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: noteEditorColors.badge, top: 9, right: 1, borderWidth: 1, borderColor: noteEditorColors.background },
  metadata: { minHeight: 48, paddingHorizontal: 20, paddingTop: 9, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timestamp: { color: noteEditorColors.secondary, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14.5, letterSpacing: -0.2 }, categoryButton: { minWidth: 44, minHeight: 40, alignItems: 'flex-end', justifyContent: 'center', paddingLeft: 12 },
  editorScroll: { flex: 1 }, editorContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 4 },
  titleInput: { minHeight: 44, padding: 0, color: notesColors.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 28, lineHeight: 35, letterSpacing: -0.5 },
  contentInput: { minHeight: 180, padding: 0, paddingTop: 2, color: notesColors.ink, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 18, lineHeight: 28, letterSpacing: -0.2 },
  templateLink: { alignSelf: 'flex-start', marginTop: -4 }, templateText: { color: noteEditorColors.placeholder, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 18, textDecorationLine: 'underline', textDecorationColor: noteEditorColors.placeholder },
  saveStatus: { marginTop: 18, color: noteEditorColors.secondary, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12 },
  toolbarScroll: { flexGrow: 0, marginHorizontal: 12, borderRadius: 22 }, toolbar: { height: 56, minWidth: '100%', paddingHorizontal: 12, alignItems: 'center', justifyContent: 'space-between', backgroundColor: noteEditorColors.surface, borderColor: noteEditorColors.hairline, borderWidth: 1, borderRadius: 22, shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 20, elevation: 2 },
  toolButton: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' }, aa: { color: notesColors.ink, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19 },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }, stateText: { color: notesColors.muted, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, textAlign: 'center' },
  error: { padding: 12, borderRadius: 10, backgroundColor: '#FFEBE9', marginBottom: 14 }, errorText: { color: notesColors.error, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 },
});
