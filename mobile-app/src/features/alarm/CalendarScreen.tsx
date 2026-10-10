import React, { useState, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import Svg, { Path } from 'react-native-svg';
import { colors, radii } from '@/theme/tokens';

// We use Plus Jakarta Sans in HTML, but the project uses Inter. 
// We will use Inter to match the project design system per instructions.

const BRAND_AMBER = '#E8A725';
const BRAND_AMBER_LIGHT = '#FDF7EB';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Use a fixed default date to match reference, or new Date() if we want it current.
  // We'll start at today but allow navigation.
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const calendarGrid = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // empty slots
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentMonth]);

  if (!fontsLoaded) return null;

  const selectedTitle = `${selectedDate.getDate()} ${MONTH_NAMES[selectedDate.getMonth()].substring(0, 3)} ${selectedDate.getFullYear()}`;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.container}>
        <View style={s.card}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>{selectedTitle}</Text>
            
            <View style={s.navRow}>
              <Pressable style={s.monthSelector} accessibilityLabel="Select month and year">
                <Text style={s.monthSelectorText}>
                  {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </Text>
                <Svg width={16} height={16} viewBox="0 0 20 20" fill="currentColor" color="#6E6C65" style={{ marginLeft: 6 }}>
                  <Path fillRule="evenodd" clipRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" />
                </Svg>
              </Pressable>
              
              <View style={s.arrows}>
                <Pressable onPress={handlePrevMonth} style={({pressed}) => [s.arrowBtn, pressed && s.arrowBtnPressed]}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#6E6C65" strokeWidth={2.2}>
                    <Path d="M15.75 19.5L8.25 12l7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </Pressable>
                <Pressable onPress={handleNextMonth} style={({pressed}) => [s.arrowBtn, pressed && s.arrowBtnPressed]}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#6E6C65" strokeWidth={2.2}>
                    <Path d="M8.25 4.5l7.5 7.5-7.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Grid */}
          <View style={s.grid}>
            {/* Headers */}
            <View style={s.weekdaysRow}>
              {DAY_HEADERS.map((d, i) => (
                <Text key={`h-${i}`} style={s.weekdayText}>{d}</Text>
              ))}
            </View>
            
            {/* Days */}
            <View style={s.daysWrap}>
              {calendarGrid.map((dateObj, i) => {
                if (!dateObj) {
                  return <View key={`empty-${i}`} style={s.dayCell} />;
                }
                
                const isSelected = 
                  dateObj.getDate() === selectedDate.getDate() &&
                  dateObj.getMonth() === selectedDate.getMonth() &&
                  dateObj.getFullYear() === selectedDate.getFullYear();

                return (
                  <View key={`day-${i}`} style={s.dayCell}>
                    <Pressable
                      onPress={() => setSelectedDate(dateObj)}
                      style={({pressed}) => [
                        s.dayBtn,
                        isSelected && s.dayBtnSelected,
                        pressed && !isSelected && s.dayBtnPressed
                      ]}
                    >
                      <Text style={[
                        s.dayText,
                        isSelected && s.dayTextSelected
                      ]}>
                        {dateObj.getDate()}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Actions */}
          <View style={s.actions}>
            <Pressable 
              onPress={() => router.back()} 
              style={({pressed}) => [s.cancelBtn, pressed && s.cancelBtnPressed]}
            >
              <Text style={s.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable 
              onPress={() => router.back()} 
              style={({pressed}) => [s.okBtn, pressed && s.okBtnPressed]}
            >
              <Text style={s.okText}>OK</Text>
            </Pressable>
          </View>

        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ECEAE4',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 384,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E8E6DF',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#191816',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.12,
        shadowRadius: 48,
      },
      android: {
        elevation: 10,
      }
    }),
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 30, // text-3xl approx
    color: '#191816',
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthSelectorText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#191816',
  },
  arrows: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: -4,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBtnPressed: {
    backgroundColor: '#F5F5F4', // stone-100
  },
  grid: {
    width: '100%',
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#A5A39D',
    letterSpacing: 1,
  },
  daysWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBtnPressed: {
    backgroundColor: '#F5F5F4',
  },
  dayBtnSelected: {
    backgroundColor: BRAND_AMBER,
    shadowColor: BRAND_AMBER,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  dayText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#191816',
  },
  dayTextSelected: {
    fontFamily: 'Inter_700Bold',
    color: '#191816',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 32,
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 99,
  },
  cancelBtnPressed: {
    backgroundColor: '#F5F5F4',
  },
  cancelText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#6E6C65',
  },
  okBtn: {
    backgroundColor: BRAND_AMBER,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 99,
  },
  okBtnPressed: {
    backgroundColor: '#D4951B',
  },
  okText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#191816',
  },
});
