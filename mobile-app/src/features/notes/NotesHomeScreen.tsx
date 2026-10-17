import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { CalendarDays, EllipsisVertical, Grid2X2Plus, List, Menu, Plus, Search, X } from 'lucide-react-native';
import { notesColors, notesRadii } from '@/theme/notesTokens';
import { NoteCard } from './NoteCard';
import { getNotesStorageError, useNotes, useNotesStorageStatus, type Note } from './notesState';
import { partitionNotes } from './notesLayout';

const categories = ['All', 'Home', 'Work'] as const;
const leftContentStyle = { paddingHorizontal: 7, paddingTop: 8, paddingBottom: 112 };
const rightContentStyle = { paddingHorizontal: 7, paddingTop: 8, paddingBottom: 112 };
const columnKey = (note: Note) => note.id;

export default function NotesHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const notes = useNotes();
  const storageStatus = useNotesStorageStatus();
  const storageError = getNotesStorageError();
  const [fontsLoaded] = useFonts({ PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold });
  const [category, setCategory] = useState<(typeof categories)[number]>('All');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [calendarTodayOnly, setCalendarTodayOnly] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [menuOpen, setMenuOpen] = useState(false);
  const [sortNewest, setSortNewest] = useState(true);
  const leftList = useRef<FlatList<Note>>(null);
  const rightList = useRef<FlatList<Note>>(null);
  const syncTarget = useRef<'left' | 'right' | null>(null);

  const visibleNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const today = new Date().toDateString();
    return notes.filter((note) => {
      const matchesCategory = category === 'All' || note.category === category;
      const matchesQuery = !normalizedQuery || `${note.title}\n${note.content}`.toLocaleLowerCase().includes(normalizedQuery);
      const matchesDate = !calendarTodayOnly || new Date(note.updatedAt).toDateString() === today;
      return matchesCategory && matchesQuery && matchesDate;
    }).sort((a, b) => sortNewest ? b.updatedAt.localeCompare(a.updatedAt) : a.updatedAt.localeCompare(b.updatedAt));
  }, [notes, query, category, calendarTodayOnly, sortNewest]);

  const columns = useMemo(() => partitionNotes(visibleNotes, layout), [visibleNotes, layout]);

  const openNote = useCallback((id: string) => router.push({ pathname: '/notes/[id]', params: { id } }), [router]);
  const createNote = useCallback(() => router.push('/notes/new'), [router]);
  const renderCard = useCallback(({ item }: { item: Note }) => <NoteCard note={item} onOpen={openNote} />, [openNote]);
  const onScroll = useCallback((source: 'left' | 'right', event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (syncTarget.current) {
      if (syncTarget.current === source) syncTarget.current = null;
      return;
    }
    const target = source === 'left' ? 'right' : 'left';
    const ref = target === 'left' ? leftList.current : rightList.current;
    if (!ref || (target === 'right' && columns.right.length === 0)) return;
    syncTarget.current = target;
    ref.scrollToOffset({ offset: Math.max(0, event.nativeEvent.contentOffset.y), animated: false });
  }, [columns.right.length]);

  const toggleSearch = useCallback(() => {
    setSearchOpen((open) => {
      if (open) setQuery('');
      return !open;
    });
  }, []);
  const showSortOptions = useCallback(() => {
    Alert.alert('Sort notes', undefined, [
      { text: 'Newest first', onPress: () => setSortNewest(true) },
      { text: 'Oldest first', onPress: () => setSortNewest(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

  if (!fontsLoaded) return <View style={styles.loadingScreen}><Text style={styles.loadingText} maxFontSizeMultiplier={1.15}>Loading notes…</Text></View>;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel={menuOpen ? 'Close folders menu' : 'Open folders menu'} onPress={() => setMenuOpen((open) => !open)} style={styles.iconButton}>
            {menuOpen ? <X size={24} color={notesColors.ink} /> : <Menu size={24} color={notesColors.ink} />}
            <View style={styles.notificationDot} />
          </Pressable>
          <View style={styles.promoPill}><Text style={styles.promoText} maxFontSizeMultiplier={1.15}>−50%</Text></View>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" accessibilityLabel={searchOpen ? 'Close search' : 'Search notes'} onPress={toggleSearch} style={styles.iconButton}>
              {searchOpen ? <X size={22} color={notesColors.ink} /> : <Search size={22} color={notesColors.ink} />}
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={calendarTodayOnly ? 'Show all dates' : 'Show today’s notes'} onPress={() => setCalendarTodayOnly((value) => !value)} style={styles.calendarButton}>
              <CalendarDays size={22} color={notesColors.ink} />
              <Text style={styles.calendarDay} maxFontSizeMultiplier={1.15}>{new Date().getDate()}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Sort notes" onPress={showSortOptions} style={styles.iconButton}>
              <EllipsisVertical size={22} color={notesColors.ink} />
            </Pressable>
          </View>
        </View>

        {searchOpen ? <View style={styles.searchBox}>
          <Search size={18} color={notesColors.muted} />
          <TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Search notes" placeholderTextColor={notesColors.muted} style={styles.searchInput} returnKeyType="search" maxFontSizeMultiplier={1.15} accessibilityLabel="Search notes" />
          {query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} hitSlop={8}><X size={18} color={notesColors.muted} /></Pressable> : null}
        </View> : null}

        {menuOpen ? <View style={styles.folderMenu}>
          <Text style={styles.folderMenuTitle} maxFontSizeMultiplier={1.15}>Folders</Text>
          {categories.map((item) => <Pressable key={item} accessibilityRole="button" accessibilityLabel={`Show ${item} notes`} onPress={() => { setCategory(item); setMenuOpen(false); }} style={styles.folderItem}><Text style={[styles.folderText, category === item && styles.folderTextActive]} maxFontSizeMultiplier={1.15}>{item}</Text></Pressable>)}
        </View> : null}

        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {categories.map((item) => <Pressable key={item} hitSlop={4} accessibilityRole="button" accessibilityState={{ selected: category === item }} accessibilityLabel={`${item} notes`} onPress={() => setCategory(item)} style={[styles.filterPill, category === item && styles.filterActive]}>
              <Text style={[styles.filterText, category === item && styles.filterTextActive]} maxFontSizeMultiplier={1.15}>{item}</Text>
            </Pressable>)}
          </ScrollView>
          <Pressable accessibilityRole="button" accessibilityLabel={layout === 'grid' ? 'Switch to list view' : 'Switch to grid view'} onPress={() => { setLayout((value) => value === 'grid' ? 'list' : 'grid'); leftList.current?.scrollToOffset({ offset: 0, animated: false }); rightList.current?.scrollToOffset({ offset: 0, animated: false }); }} style={styles.layoutButton}>
            {layout === 'grid' ? <Grid2X2Plus size={21} color="#767770" /> : <List size={21} color="#767770" />}
          </Pressable>
        </View>

        {calendarTodayOnly ? <Pressable accessibilityRole="button" accessibilityLabel="Clear today filter" onPress={() => setCalendarTodayOnly(false)} style={styles.dateFilter}><Text style={styles.dateFilterText} maxFontSizeMultiplier={1.15}>Today · tap to clear</Text></Pressable> : null}
        {storageStatus === 'error' ? <View accessibilityRole="alert" style={styles.errorBanner}><Text style={styles.errorText} maxFontSizeMultiplier={1.15}>Notes storage issue: {storageError ?? 'Your notes may not be saved.'}</Text></View> : null}

        <View style={styles.listArea}>
          {storageStatus === 'loading' ? <View style={styles.centerState}><Text style={styles.stateText} maxFontSizeMultiplier={1.15}>Loading your notes…</Text></View> : visibleNotes.length === 0 ? <View style={styles.centerState}><Text style={styles.emptyTitle} maxFontSizeMultiplier={1.15}>{notes.length === 0 ? 'No notes yet' : query || calendarTodayOnly || category !== 'All' ? 'No matching notes' : 'Nothing to show here'}</Text><Text style={styles.stateText} maxFontSizeMultiplier={1.15}>{notes.length === 0 ? 'Create a note to get started.' : 'Try another folder or search.'}</Text></View> : (
            <View style={styles.columns}>
              <FlatList ref={leftList} style={styles.columnList} data={columns.left} keyExtractor={columnKey} renderItem={renderCard} contentContainerStyle={leftContentStyle} windowSize={5} initialNumToRender={6} maxToRenderPerBatch={8} updateCellsBatchingPeriod={40} removeClippedSubviews={Platform.OS === 'android'} scrollEventThrottle={16} onScroll={(event) => onScroll('left', event)} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" />
              {layout === 'grid' ? <FlatList ref={rightList} style={styles.columnList} data={columns.right} keyExtractor={columnKey} renderItem={renderCard} contentContainerStyle={rightContentStyle} windowSize={5} initialNumToRender={6} maxToRenderPerBatch={8} updateCellsBatchingPeriod={40} removeClippedSubviews={Platform.OS === 'android'} scrollEventThrottle={16} onScroll={(event) => onScroll('right', event)} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" /> : null}
            </View>
          )}
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Create new note" onPress={createNote} style={({ pressed }) => [styles.fab, { bottom: 66 + insets.bottom }, pressed && styles.fabPressed]}>
          <Plus size={29} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
        <View style={[styles.bottomBanner, { paddingBottom: Math.max(insets.bottom, 0) }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: notesColors.background },
  screen: { flex: 1, backgroundColor: notesColors.background },
  loadingScreen: { flex: 1, backgroundColor: notesColors.background, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: notesColors.muted, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14 },
  header: { height: 68, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  notificationDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#FA5A55', top: 8, right: 7, borderWidth: 1, borderColor: notesColors.background },
  promoPill: { width: 84, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF9D00', borderRadius: 20 },
  promoText: { color: '#FFFFFF', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 17 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  calendarButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  calendarDay: { position: 'absolute', top: 21, color: notesColors.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 8 },
  searchBox: { height: 48, marginHorizontal: 16, marginBottom: 6, paddingHorizontal: 12, borderRadius: 14, borderColor: notesColors.cardBorder, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF' },
  searchInput: { flex: 1, color: notesColors.ink, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, paddingVertical: 0 },
  folderMenu: { position: 'absolute', left: 14, top: 60, zIndex: 10, minWidth: 150, padding: 10, borderRadius: 14, backgroundColor: '#FFFFFF', borderColor: notesColors.cardBorder, borderWidth: 1, elevation: 5 },
  folderMenuTitle: { color: notesColors.muted, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, paddingHorizontal: 10, paddingVertical: 7 },
  folderItem: { height: 42, justifyContent: 'center', paddingHorizontal: 10 },
  folderText: { color: notesColors.ink, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14 },
  folderTextActive: { color: notesColors.blue, fontFamily: 'PlusJakartaSans_600SemiBold' },
  filterRow: { height: 60, flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 14 },
  filters: { alignItems: 'center', gap: 8, paddingRight: 6 },
  filterPill: { height: 36, minWidth: 78, paddingHorizontal: 20, borderRadius: notesRadii.pill, backgroundColor: `${notesColors.filter}CC`, justifyContent: 'center', alignItems: 'center' },
  filterActive: { backgroundColor: notesColors.blue, shadowColor: '#029CFE', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.16, shadowRadius: 4, elevation: 1 },
  filterText: { color: '#62635D', fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12 },
  filterTextActive: { color: '#FFFFFF' },
  layoutButton: { height: 44, width: 44, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  dateFilter: { alignSelf: 'flex-start', marginLeft: 18, marginBottom: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: '#E8F5FC' },
  dateFilterText: { color: notesColors.blue, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11 },
  errorBanner: { marginHorizontal: 16, marginVertical: 4, padding: 10, borderRadius: 10, backgroundColor: '#FFEBE9' },
  errorText: { color: notesColors.error, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12 },
  listArea: { flex: 1 },
  columns: { flex: 1, flexDirection: 'row' },
  columnList: { flex: 1 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { color: notesColors.ink, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 18 },
  stateText: { color: notesColors.muted, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, textAlign: 'center', marginTop: 8 },
  fab: { position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: notesColors.blueDeep, alignItems: 'center', justifyContent: 'center', shadowColor: '#0091FF', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.26, shadowRadius: 17, elevation: 8, zIndex: 8 },
  fabPressed: { opacity: 0.88, transform: [{ scale: 0.96 }] },
  bottomBanner: { height: 52, backgroundColor: '#080808' },
});
