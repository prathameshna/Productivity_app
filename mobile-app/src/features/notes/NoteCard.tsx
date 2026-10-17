import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { notesColors, notesRadii } from '@/theme/notesTokens';
import type { Note } from './notesState';

type Props = { note: Note; onOpen: (id: string) => void };

function NoteCardComponent({ note, onOpen }: Props) {
  const handlePress = useCallback(() => onOpen(note.id), [note.id, onOpen]);
  const time = new Date(note.updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();
  const isDocumentPreview = note.id === 'sample-urgent';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open note ${note.title || note.content.slice(0, 40) || 'Untitled'}`}
      onPress={handlePress}
      style={({ pressed }) => [styles.card, isDocumentPreview && styles.firstCard, pressed && styles.pressed]}
    >
      {isDocumentPreview ? <DocumentPreview /> : null}
      {note.title ? <Text style={[styles.title, note.title.startsWith('*URGENT') && styles.urgent]} maxFontSizeMultiplier={1.15}>{note.title}</Text> : null}
      {note.content ? <Text style={[styles.body, note.title ? styles.bodyAfterTitle : null]} numberOfLines={note.id === 'sample-links' ? 7 : 8} maxFontSizeMultiplier={1.15}>{note.content}</Text> : null}
      <Text style={styles.time} maxFontSizeMultiplier={1.15}>{time}</Text>
    </Pressable>
  );
}

function DocumentPreview() {
  return (
    <View style={styles.document} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.documentLines}>
        <View style={[styles.line, styles.lineWide]} />
        <View style={[styles.line, styles.lineLong]} />
        <View style={[styles.line, styles.lineMed]} />
        <View style={[styles.line, styles.lineShort]} />
        <View style={[styles.line, styles.lineMid]} />
      </View>
      <View style={styles.documentFooter}>
        <View style={[styles.line, styles.lineHalf]} />
        <View style={[styles.line, styles.lineLong]} />
      </View>
    </View>
  );
}

export const NoteCard = memo(NoteCardComponent);

const styles = StyleSheet.create({
  card: { backgroundColor: notesColors.card, borderColor: notesColors.cardBorder, borderWidth: 1, borderRadius: notesRadii.noteCard, padding: 14, marginBottom: 12, minHeight: 96, justifyContent: 'space-between' },
  firstCard: { padding: 12 },
  pressed: { opacity: 0.88 },
  title: { color: notesColors.ink, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, lineHeight: 20 },
  urgent: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, lineHeight: 20 },
  body: { color: '#292A26', fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, lineHeight: 24 },
  bodyAfterTitle: { marginTop: 8 },
  time: { color: '#8A8B85', fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, lineHeight: 16, marginTop: 18, paddingTop: 2 },
  document: { height: 108, backgroundColor: '#F0ECE6', borderColor: '#E5DED3', borderWidth: 1, borderRadius: 15, padding: 10, marginBottom: 12, justifyContent: 'space-between', overflow: 'hidden' },
  documentLines: { gap: 5 },
  line: { height: 5, borderRadius: 5, backgroundColor: '#C7C6C2' },
  lineWide: { width: '76%', height: 7, backgroundColor: '#D1D0CE' },
  lineLong: { width: '88%' },
  lineMed: { width: '72%' },
  lineShort: { width: '63%' },
  lineMid: { width: '80%' },
  documentFooter: { borderTopColor: '#D8D2C9', borderTopWidth: 1, borderStyle: 'dashed', paddingTop: 5, gap: 4 },
  lineHalf: { width: '48%' },
});
