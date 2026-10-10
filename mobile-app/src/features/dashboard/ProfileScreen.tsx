import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  ChevronLeft,
  ChevronRight,
  User,
  Flag,
  BarChart2,
  Award,
  CheckCircle2,
  Gift
} from 'lucide-react-native';
import { colors, radii, spacing } from '@/theme/tokens';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Top Bar */}
      <View style={s.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, pressed && s.backBtnPressed]}
          accessibilityLabel="Go Back"
        >
          <ChevronLeft size={24} color={colors.ink} strokeWidth={2.2} />
        </Pressable>
        <View style={{ width: 24, height: 24 }} />
      </View>

      {/* Main Content */}
      <ScrollView
        style={s.scrollArea}
        contentContainerStyle={[
          s.scrollContent,
          { paddingBottom: insets.bottom + 32 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={s.profileHeader}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>JP</Text>
          </View>
          <View style={s.nameContainer}>
            <Text style={s.nameText}>John Prathamesh</Text>
            <View style={s.proBadge}>
              <Text style={s.proBadgeText}>Pro</Text>
            </View>
          </View>
        </View>

        {/* Settings Sections */}
        <View style={s.sectionsContainer}>
          
          {/* Section 1: ACCOUNT */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Account</Text>
            <View style={s.card}>
              <Pressable style={({ pressed }) => [s.row, pressed && s.rowPressed]}>
                <View style={s.rowLeft}>
                  <User size={20} color={colors.secondary} strokeWidth={1.8} />
                  <Text style={s.rowLabel}>Edit Profile</Text>
                </View>
                <ChevronRight size={16} color="#9E9F99" strokeWidth={2.2} />
              </Pressable>
              
              <View style={s.divider} />
              
              <Pressable style={({ pressed }) => [s.row, pressed && s.rowPressed]}>
                <View style={s.rowLeft}>
                  <Flag size={20} color={colors.secondary} strokeWidth={1.8} />
                  <Text style={s.rowLabel}>Connected Apps</Text>
                </View>
                <ChevronRight size={16} color="#9E9F99" strokeWidth={2.2} />
              </Pressable>
            </View>
          </View>

          {/* Section 2: PRODUCTIVITY */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Productivity</Text>
            <View style={s.card}>
              <Pressable style={({ pressed }) => [s.row, pressed && s.rowPressed]}>
                <View style={s.rowLeft}>
                  <BarChart2 size={20} color={colors.secondary} strokeWidth={1.8} />
                  <Text style={s.rowLabel}>Reports</Text>
                </View>
                <ChevronRight size={16} color="#9E9F99" strokeWidth={2.2} />
              </Pressable>
              
              <View style={s.divider} />
              
              <Pressable style={({ pressed }) => [s.row, s.rowPy35, pressed && s.rowPressed]}>
                <View style={s.rowLeft}>
                  <Award size={20} color={colors.secondary} strokeWidth={1.8} />
                  <View style={s.rowMultiline}>
                    <Text style={s.rowLabel}>Subscription and</Text>
                    <Text style={s.rowLabel}>Plan</Text>
                  </View>
                </View>
                <View style={s.rowRightGroup}>
                  <View style={s.upgradeBadge}>
                    <Text style={s.upgradeBadgeText}>Upgrade</Text>
                  </View>
                  <ChevronRight size={16} color="#9E9F99" strokeWidth={2.2} />
                </View>
              </Pressable>
            </View>
          </View>

          {/* Section 3: SUPPORT */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Support</Text>
            <View style={s.card}>
              <Pressable style={({ pressed }) => [s.row, pressed && s.rowPressed]}>
                <View style={s.rowLeft}>
                  <CheckCircle2 size={20} color={colors.secondary} strokeWidth={1.8} />
                  <Text style={s.rowLabel}>FAQ</Text>
                </View>
                <ChevronRight size={16} color="#9E9F99" strokeWidth={2.2} />
              </Pressable>
              
              <View style={s.divider} />
              
              <Pressable style={({ pressed }) => [s.row, pressed && s.rowPressed]}>
                <View style={s.rowLeft}>
                  <Gift size={20} color={colors.secondary} strokeWidth={1.8} />
                  <Text style={s.rowLabel}>Refer a Friend</Text>
                </View>
                <View style={s.rowRightGroup}>
                  <View style={s.referBadge}>
                    <Text style={s.referBadgeText}>Get 1 month free</Text>
                  </View>
                  <ChevronRight size={16} color="#9E9F99" strokeWidth={2.2} />
                </View>
              </Pressable>
            </View>
          </View>

        </View>

        {/* Sign Out Action */}
        <View style={s.signOutContainer}>
          <Pressable style={({ pressed }) => [s.signOutBtn, pressed && s.signOutBtnPressed]}>
            <Text style={s.signOutText}>Sign out</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAF9F6', // surface
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  backBtnPressed: {
    backgroundColor: '#F5F5F5',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center', // Main max-w-md mx-auto center align equivalent
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 32,
    width: '100%',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EBF3FE', // accentBlueBg related
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 30, // text-3xl
    color: '#2563EB',
    letterSpacing: -0.5,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  nameText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: '#18181B', // brandText
    letterSpacing: -0.5,
    marginRight: 10,
  },
  proBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 6,
  },
  proBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  sectionsContainer: {
    width: '100%',
    gap: 24, // space-y-6 equivalent
  },
  section: {
    width: '100%',
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12, // text-xs
    color: '#9E9F99', // subtleText
    textTransform: 'uppercase',
    letterSpacing: 0.5, // tracking-wider
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#F0EEE9', // cardBorder
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16, // py-4
  },
  rowPy35: {
    paddingVertical: 14, // py-3.5
  },
  rowPressed: {
    backgroundColor: '#FAFAF9', // stone-50
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#18181B', // brandText
    marginLeft: 14,
  },
  rowMultiline: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F2EFE9',
    marginLeft: 52, // ml-13 (20 + 20 + 14 approx minus padding adjustments)
    marginRight: 20,
  },
  rowRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: radii.pill,
    marginRight: 8,
  },
  upgradeBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#2563EB',
  },
  referBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#DCFCE7', // accentGreenBg
    borderRadius: radii.pill,
    marginRight: 8,
  },
  referBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#15803D', // text-[#15803D]
  },
  signOutContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 16,
  },
  signOutBtn: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: radii.sm,
  },
  signOutBtnPressed: {
    opacity: 0.75,
  },
  signOutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#EF4444', // coralSignout
  },
});
