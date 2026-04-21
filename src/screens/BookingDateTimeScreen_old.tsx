import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Calendar, Clock, ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useBooking } from '../contexts/BookingContext';
import type { RootStackParamList } from '../types/navigation';

const timeSlots = [
  { label: "09:00", value: "09:00" },
  { label: "09:30", value: "09:30" },
  { label: "10:00", value: "10:00" },
  { label: "10:30", value: "10:30" },
  { label: "11:00", value: "11:00" },
  { label: "11:30", value: "11:30" },
  { label: "12:00", value: "12:00" },
  { label: "12:30", value: "12:30" },
  { label: "13:00", value: "13:00" },
  { label: "13:30", value: "13:30" },
  { label: "14:00", value: "14:00" },
  { label: "14:30", value: "14:30" },
  { label: "15:00", value: "15:00" },
  { label: "15:30", value: "15:30" },
  { label: "16:00", value: "16:00" },
  { label: "16:30", value: "16:30" },
  { label: "17:00", value: "17:00" },
  { label: "17:30", value: "17:30" },
];

export default function BookingDateTimeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { t } = useLanguage();
  const { bookingData, updateBookingData, setCurrentStep } = useBooking();

  const [selectedDate, setSelectedDate] = useState(bookingData.date);
  const [selectedTime, setSelectedTime] = useState(bookingData.time);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generate date options for next 30 days
  const dateOptions = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const iso = `${yyyy}-${mm}-${dd}`;
      const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
      const label = `${weekday}, ${dd}/${mm}`;
      const isToday = i === 0;
      const isTomorrow = i === 1;
      return { value: iso, label, weekday, day: dd, month: mm, isToday, isTomorrow };
    });
  }, []);

  // Get nearest available time slot
  const getNearestTimeSlot = () => {
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const mins = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const next = timeSlots.find(s => mins(s.value) >= current + 30); // 30 min buffer
    return next?.value || timeSlots[0].value;
  };

  // Set default time if none selected
  React.useEffect(() => {
    if (!selectedTime && selectedDate) {
      const isToday = selectedDate === dateOptions[0].value;
      const defaultTime = isToday ? getNearestTimeSlot() : timeSlots[0].value;
      setSelectedTime(defaultTime);
    }
  }, [selectedDate, dateOptions]);

  const handleContinue = () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Missing Fields', 'Please select date and time');
      return;
    }

    updateBookingData({
      date: selectedDate,
      time: selectedTime,
    });

    setCurrentStep(2);
    navigation.navigate('BookingVehicle' as any);
  };

  const isTimeSlotDisabled = (timeValue: string) => {
    if (selectedDate !== dateOptions[0].value) return false; // Not today
    
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const [h, m] = timeValue.split(':').map(Number);
    const slotTime = h * 60 + m;
    
    return slotTime <= current + 30; // 30 min buffer
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateForCalendar = (year: number, month: number, day: number) => {
    const yyyy = year;
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const isDateDisabled = (date: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    return checkDate < today;
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = formatDateForCalendar(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      days.push({
        day,
        dateString,
        isDisabled: isDateDisabled(dateString),
        isSelected: selectedDate === dateString,
        isToday: dateString === dateOptions[0].value,
      });
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return 'Select Date';
    const date = new Date(selectedDate);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <Header 
        title="Select Date & Time" 
        onBack={() => navigation.goBack()}
        subtitle="Step 1 of 5"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '20%', backgroundColor: colors.accent }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            Step 1 of 5: Select Date & Time
          </Text>
        </View>

        {/* Date Selection */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Date *</Text>
          </View>
          
          <Pressable
            onPress={() => setShowCalendar(true)}
            style={[styles.datePickerButton, { 
              backgroundColor: colors.surface, 
              borderColor: colors.cardBorder 
            }]}
          >
            <View style={styles.datePickerContent}>
              <Calendar size={18} color={colors.accent} />
              <Text style={[styles.datePickerText, { color: colors.textPrimary }]}>
                {formatSelectedDate()}
              </Text>
            </View>
            <ChevronDown size={18} color={colors.textSecondary} />
          </Pressable>

          {/* Quick Date Options */}
          <View style={styles.quickDateOptions}>
            {dateOptions.slice(0, 3).map((date) => {
              const isSelected = selectedDate === date.value;
              const label = date.isToday ? 'Today' : date.isTomorrow ? 'Tomorrow' : date.weekday;
              return (
                <Pressable
                  key={date.value}
                  onPress={() => setSelectedDate(date.value)}
                  style={[
                    styles.quickDateChip,
                    { 
                      backgroundColor: isSelected ? colors.accent : colors.surface,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    }
                  ]}
                >
                  <Text style={[
                    styles.quickDateText, 
                    { color: isSelected ? '#ffffff' : colors.textPrimary }
                  ]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Time Selection */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Time *</Text>
          </View>
          
          {/* Time Periods */}
          <View style={styles.timePeriodsContainer}>
            {[
              { label: 'Morning', slots: timeSlots.slice(0, 8), icon: '🌅' },
              { label: 'Afternoon', slots: timeSlots.slice(8, 16), icon: '☀️' },
              { label: 'Evening', slots: timeSlots.slice(16), icon: '🌆' }
            ].map((period) => (
              <View key={period.label} style={styles.timePeriod}>
                <View style={styles.timePeriodHeader}>
                  <Text style={styles.timePeriodIcon}>{period.icon}</Text>
                  <Text style={[styles.timePeriodLabel, { color: colors.textPrimary }]}>
                    {period.label}
                  </Text>
                </View>
                <View style={styles.timeSlotRow}>
                  {period.slots.map((slot) => {
                    const isSelected = selectedTime === slot.value;
                    const isDisabled = isTimeSlotDisabled(slot.value);
                    
                    return (
                      <Pressable
                        key={slot.value}
                        onPress={() => !isDisabled && setSelectedTime(slot.value)}
                        disabled={isDisabled}
                        style={[
                          styles.modernTimeSlot,
                          {
                            backgroundColor: isSelected ? colors.accent : colors.surface,
                            borderColor: isSelected ? colors.accent : colors.cardBorder,
                            opacity: isDisabled ? 0.4 : 1,
                          }
                        ]}
                      >
                        <Text style={[
                          styles.modernTimeText,
                          { color: isSelected ? '#ffffff' : colors.textPrimary }
                        ]}>
                          {slot.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Selected Summary */}
        {selectedDate && selectedTime && (
          <Card style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Selected Appointment</Text>
            <View style={styles.summaryContent}>
              <View style={styles.summaryItem}>
                <Calendar size={16} color={colors.accent} />
                <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                  {formatSelectedDate()}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Clock size={16} color={colors.accent} />
                <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                  {selectedTime}
                </Text>
              </View>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.continueContainer, { paddingBottom: insets.bottom }]}>
        <Button
          title="Continue"
          onPress={handleContinue}
          style={[styles.continueButton, { backgroundColor: colors.accent }]}
          textStyle={[styles.continueButtonText, { color: '#ffffff' }]}
          disabled={!selectedDate || !selectedTime}
        />
      </View>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCalendar(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.cardBorder }]}>
            <Pressable onPress={() => setShowCalendar(false)}>
              <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Date</Text>
            <Pressable onPress={() => setShowCalendar(false)}>
              <Text style={[styles.modalDoneText, { color: colors.accent }]}>Done</Text>
            </Pressable>
          </View>

          <View style={styles.calendarContainer}>
            {/* Month Navigation */}
            <View style={[styles.monthHeader, { borderBottomColor: colors.cardBorder }]}>
              <Pressable 
                onPress={() => navigateMonth('prev')}
                style={styles.monthNavButton}
              >
                <ChevronLeft size={24} color={colors.textPrimary} />
              </Pressable>
              <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <Pressable 
                onPress={() => navigateMonth('next')}
                style={styles.monthNavButton}
              >
                <ChevronRight size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            {/* Weekday Headers */}
            <View style={styles.weekdayHeader}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text key={day} style={[styles.weekdayText, { color: colors.textSecondary }]}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {generateCalendarDays().map((day, index) => (
                <Pressable
                  key={index}
                  onPress={() => day && !day.isDisabled && setSelectedDate(day.dateString)}
                  disabled={!day || day.isDisabled}
                  style={[
                    styles.calendarDay,
                    {
                      backgroundColor: day?.isSelected ? colors.accent : 'transparent',
                      borderColor: day?.isToday ? colors.accent : 'transparent',
                    }
                  ]}
                >
                  {day && (
                    <Text style={[
                      styles.calendarDayText,
                      {
                        color: day.isSelected 
                          ? '#ffffff' 
                          : day.isDisabled 
                            ? colors.textSecondary + '50'
                            : day.isToday 
                              ? colors.accent 
                              : colors.textPrimary
                      }
                    ]}>
                      {day.day}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </Modal>
      title="Continue"
      onPress={handleContinue}
      style={[styles.continueButton, { backgroundColor: colors.accent }]}
      textStyle={[styles.continueButtonText, { color: '#ffffff' }]}
      disabled={!selectedDate || !selectedTime}
    />
  </View>

  {/* Calendar Modal */}
  <Modal
    visible={showCalendar}
    animationType="slide"
    presentationStyle="pageSheet"
    onRequestClose={() => setShowCalendar(false)}
  >
    <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
      <View style={[styles.modalHeader, { borderBottomColor: colors.cardBorder }]}>
        <Pressable onPress={() => setShowCalendar(false)}>
          <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Date</Text>
        <Pressable onPress={() => setShowCalendar(false)}>
          <Text style={[styles.modalDoneText, { color: colors.accent }]}>Done</Text>
        </Pressable>
      </View>

      <View style={styles.calendarContainer}>
        {/* Month Navigation */}
        <View style={[styles.monthHeader, { borderBottomColor: colors.cardBorder }]}>
          <Pressable 
            onPress={() => navigateMonth('prev')}
            style={styles.monthNavButton}
          >
            <ChevronLeft size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <Pressable 
            onPress={() => navigateMonth('next')}
            style={styles.monthNavButton}
          >
            <ChevronRight size={24} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* Weekday Headers */}
        <View style={styles.weekdayHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Text key={day} style={[styles.weekdayText, { color: colors.textSecondary }]}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {generateCalendarDays().map((day, index) => (
            <Pressable
              key={index}
              onPress={() => day && !day.isDisabled && setSelectedDate(day.dateString)}
              disabled={!day || day.isDisabled}
              style={[
                styles.calendarDay,
                {
                  backgroundColor: day?.isSelected ? colors.accent : 'transparent',
                  borderColor: day?.isToday ? colors.accent : 'transparent',
                }
              ]}
            >
              {day && (
                <Text style={[
                  styles.calendarDayText,
                  {
                    color: day.isSelected 
                      ? '#ffffff' 
                      : day.isDisabled 
                        ? colors.textSecondary + '50'
                        : day.isToday 
                          ? colors.accent 
                          : colors.textPrimary
                  }
                ]}>
                  {day.day}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  </Modal>
</SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionCard: {
    padding: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateScroll: {
    marginHorizontal: -4,
  },
  dateScrollContent: {
    paddingHorizontal: 4,
    gap: 12,
  },
  dateCard: {
    width: 80,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  dateWeekday: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateDay: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    width: '22%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryCard: {
    padding: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryContent: {
    gap: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  continueButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  continueContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  // Date picker styles
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePickerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  quickDateOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickDateChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickDateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Time selection styles
  timePeriodsContainer: {
    gap: 20,
  },
  timePeriod: {
    gap: 12,
  },
  timePeriodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timePeriodIcon: {
    fontSize: 16,
  },
  timePeriodLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeSlotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modernTimeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
  },
  modernTimeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCancelText: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalDoneText: {
    fontSize: 16,
    fontWeight: '600',
  },
  calendarContainer: {
    flex: 1,
    padding: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  monthNavButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    margin: 1,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
