import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookingFooter } from '../components/ui/BookingFooter';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { useBooking } from '../contexts/BookingContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useModal } from '../contexts/ModalContext';
import { useThemeColors } from '../lib/theme';
import { CityTimeSlot, NaqiagoBookingDateTimeAPI, type TimeSlot } from '../services/NaqiagoBookingDateTimeAPI';
import type { RootStackParamList } from '../types/navigation';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentNoScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
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
  },
  combinedRow: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 12,
  },
  calendarCard: {
    padding: 8,
    maxHeight: 320,
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
  timeCard: {
    padding: 12,
    flexShrink: 0,
    minHeight: 120,
  },
  timeScroller: {
    marginBottom: 8,
  },
  timePill: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 78,
  },
  timePillText: {
    fontSize: 15,
    fontWeight: '600',
  },
  compactSummary: {
    marginTop: 12,
    alignItems: 'center',
  },
  compactSummaryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    marginBottom: 6,
  },
  monthNavButton: {
    padding: 6,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    paddingVertical: 2,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 1,
    position: 'relative',
  },
  calendarDayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  noSlotsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noSlotsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  activeDateIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  inactiveDateIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF4444',
  },
  cityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  cityName: {
    fontSize: 14,
    fontWeight: '600',
  },
  changeCityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  changeCityText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

// Interfaces are now imported from NaqiagoBookingDateTimeAPI service

export default function BookingDateTimeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const colors = useThemeColors();
  const { t } = useLanguage();
  const { bookingData, updateBookingData, setCurrentStep } = useBooking();
  const { show } = useModal();

  const [selectedDate, setSelectedDate] = useState<string>(bookingData.date || '');
  const [selectedTime, setSelectedTime] = useState<string>(bookingData.time || '');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [defaultTimeSlots, setDefaultTimeSlots] = useState<TimeSlot[]>([]);
  const [filteredTimeSlots, setFilteredTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(true);
  const [timeSlotsError, setTimeSlotsError] = useState<string | null>(null);
  const [cityTimeSlots, setCityTimeSlots] = useState<Record<string, CityTimeSlot>>({});
  const [loadingCitySlots, setLoadingCitySlots] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('Casablanca');

  // Get selected city from AsyncStorage
  useEffect(() => {
    const getSelectedCity = async () => {
      try {
        const city = await AsyncStorage.getItem('selectedCity');
        if (city) {
          let cityName = city;
          if (city.includes(',')) {
            cityName = city.split(',')[0].trim();
          }
          setSelectedCity(cityName);
        } else {
          setSelectedCity('Casablanca');
        }
      } catch (error) {
        console.error('Error getting selected city:', error);
        setSelectedCity('Casablanca');
      }
    };
    
    getSelectedCity();
  }, []);

  // Fetch default time slots from API (always available)
  const fetchDefaultTimeSlots = async () => {
    try {
      setLoadingTimeSlots(true);
      setTimeSlotsError(null);
      
      const slots = await NaqiagoBookingDateTimeAPI.getTimeSlots();
      setDefaultTimeSlots(slots);
      console.log('Default time slots loaded:', slots);
    } catch (error) {
      console.error('Error fetching default time slots:', error);
      setTimeSlotsError('Failed to load time slots');
      
      // Fallback to hardcoded default time slots if API fails
      const fallbackSlots = NaqiagoBookingDateTimeAPI.getFallbackTimeSlots();
      setDefaultTimeSlots(fallbackSlots);
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  // Fetch city-specific availability (optional, only for filtering)
  const fetchCityAvailability = async () => {
    try {
      setLoadingCitySlots(true);
      
      const data = await NaqiagoBookingDateTimeAPI.getCityAvailability(selectedCity);
      console.log('City availability response:', data);
      setCityTimeSlots(data);
    } catch (error) {
      console.error('Error fetching city availability:', error);
      setCityTimeSlots({});
    } finally {
      setLoadingCitySlots(false);
    }
  };

  // Initial fetch of default time slots
  useEffect(() => {
    fetchDefaultTimeSlots();
  }, []);

  // Fetch city slots when selected city changes
  useEffect(() => {
    if (selectedCity) {
      fetchCityAvailability();
    }
  }, [selectedCity]);

  // Filter time slots based on city's active hours for selected date
  // CRITICAL: If status is "inactive", show NO time slots
  useEffect(() => {
    if (defaultTimeSlots.length === 0 || loadingCitySlots || !selectedDate) {
      setFilteredTimeSlots([]);
      return;
    }

    const selectedDateSlot = cityTimeSlots[selectedDate];
    
    // Use the API service method to filter time slots
    const filtered = NaqiagoBookingDateTimeAPI.filterTimeSlotsByAvailability(
      defaultTimeSlots,
      selectedDateSlot
    );

    if (filtered.length === 0) {
      console.log(`No available time slots for ${selectedDate}`);
    } else {
      console.log(`Filtered to ${filtered.length} time slots for ${selectedDate}`);
    }

    setFilteredTimeSlots(filtered);

    // Reset selected time if it's no longer available
    if (selectedTime && !filtered.some(slot => slot.value === selectedTime)) {
      setSelectedTime('');
    }
  }, [defaultTimeSlots, cityTimeSlots, selectedDate, selectedTime, loadingCitySlots]);

  // Set default selected date to today if not set
  useEffect(() => {
    if (!selectedDate) {
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
    }
  }, []);

  // Check if a date has custom active hours (for visual indicator)
  const hasCustomHours = (dateString: string) => {
    const dateSlot = cityTimeSlots[dateString];
    return dateSlot && dateSlot.status === 'active';
  };

  // Check if a date is inactive (for visual indicator)
  const isDateInactive = (dateString: string) => {
    const dateSlot = cityTimeSlots[dateString];
    return dateSlot && dateSlot.status === 'inactive';
  };

  // Get nearest available time slot for current date
  const getNearestTimeSlot = () => {
    if (filteredTimeSlots.length === 0) return '';
    
    const now = new Date();
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Only apply nearest time logic for today
    if (selectedDate === currentDate) {
      const current = now.getHours() * 60 + now.getMinutes();
      const mins = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      const next = filteredTimeSlots.find(s => mins(s.value) >= current + 30);
      return next?.value || filteredTimeSlots[0]?.value || '';
    }
    
    return filteredTimeSlots[0]?.value || '';
  };

  const isTimeSlotDisabled = (timeValue: string) => {
    const currentDate = new Date().toISOString().split('T')[0];
    if (selectedDate !== currentDate) return false; // Not today
    
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const [h, m] = timeValue.split(':').map(Number);
    const slotTime = h * 60 + m;
    
    return slotTime <= current + 30; // 30 min buffer
  };

  // Filter available time slots (only show non-disabled slots)
  const availableTimeSlots = useMemo(() => {
    return filteredTimeSlots.filter(slot => !isTimeSlotDisabled(slot.value));
  }, [selectedDate, filteredTimeSlots]);

  // Set default time if none selected
  useEffect(() => {
    if (loadingTimeSlots || loadingCitySlots || !selectedDate) return;
    
    if (!selectedTime && availableTimeSlots.length > 0) {
      const defaultTime = getNearestTimeSlot();
      if (defaultTime) {
        setSelectedTime(defaultTime);
      }
    }
    
    // If selected time becomes disabled, select first available
    if (selectedTime && isTimeSlotDisabled(selectedTime)) {
      const firstAvailable = availableTimeSlots[0]?.value;
      if (firstAvailable) {
        setSelectedTime(firstAvailable);
      }
    }
  }, [selectedDate, availableTimeSlots, loadingTimeSlots, loadingCitySlots]);

  const handleContinue = () => {
    if (!selectedDate || !selectedTime) {
      show({
        type: 'warning',
        title: t('missing_fields_alert'),
        message: t('please_select_date_and_time'),
      });
      return;
    }

    updateBookingData({
      date: selectedDate,
      time: selectedTime,
    });

    setCurrentStep(2);
    navigation.navigate('BookingVehicle' as any);
  };

  const handleChangeCity = () => {
    navigation.goBack();
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
      const hasCustom = hasCustomHours(dateString);
      const isInactive = isDateInactive(dateString);
      
      // Only disable dates that are in the past
      const shouldDisable = isDateDisabled(dateString);
      
      days.push({
        day,
        dateString,
        isDisabled: shouldDisable,
        isSelected: selectedDate === dateString,
        isToday: dateString === new Date().toISOString().split('T')[0],
        hasCustomHours: hasCustom,
        isInactive: isInactive,
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
    if (!selectedDate) return t('select_date_button');
    const date = new Date(selectedDate);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get active hours display text (only if custom hours exist)
  const getActiveHoursText = () => {
    const selectedDateSlot = cityTimeSlots[selectedDate];
    if (!selectedDateSlot || selectedDateSlot.status !== 'active') return '';
    
    const startTime = `${String(selectedDateSlot.startHour).padStart(2, '0')}:${String(selectedDateSlot.startMinutes).padStart(2, '0')}`;
    const endTime = `${String(selectedDateSlot.endHour).padStart(2, '0')}:${String(selectedDateSlot.endMinutes).padStart(2, '0')}`;
    return ` (Custom hours: ${startTime} - ${endTime})`;
  };

  // Render time selector based on loading state
  const renderTimeSelector = () => {
    if (loadingTimeSlots || loadingCitySlots) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ color: colors.textSecondary, marginTop: 12 }}>
            Loading time slots...
          </Text>
        </View>
      );
    }

    if (timeSlotsError && defaultTimeSlots.length === 0) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {timeSlotsError}
          </Text>
          <Pressable 
            style={[styles.retryButton, { backgroundColor: colors.accent }]}
            onPress={() => {
              fetchDefaultTimeSlots();
              fetchCityAvailability();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    if (availableTimeSlots.length === 0) {
      const isInactive = isDateInactive(selectedDate);
      const message = isInactive 
        ? `No services available on ${formatSelectedDate()} in ${selectedCity}. Please select another date.`
        : `No time slots available for ${formatSelectedDate()}${getActiveHoursText()} in ${selectedCity}.`;
      
      return (
        <View style={styles.noSlotsContainer}>
          <Text style={[styles.noSlotsText, { color: colors.textSecondary }]}>
            {message}
          </Text>
        </View>
      );
    }

    return (
      <>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 4 }}
          style={styles.timeScroller}
        >
          {availableTimeSlots.map((slot) => {
            const isSelected = selectedTime === slot.value;
            return (
              <Pressable
                key={slot.value}
                onPress={() => setSelectedTime(slot.value)}
                style={[styles.timePill, {
                  backgroundColor: isSelected ? colors.accent : colors.surface,
                  borderColor: isSelected ? colors.accent : colors.cardBorder,
                }]}
              >
                <Text style={[styles.timePillText, { color: isSelected ? '#ffffff' : colors.textPrimary }]}> 
                  {slot.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Selected summary */}
        {selectedDate && selectedTime && (
          <View style={styles.compactSummary}>
            <Text style={[styles.compactSummaryText, { color: colors.textSecondary }]}>
              {formatSelectedDate()} • {selectedTime} • {selectedCity}{getActiveHoursText()}
            </Text>
          </View>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <Header 
        title={t('select_date_time_title')} 
        onBack={() => navigation.goBack()}
        subtitle={t('step_1_of_6')}
      />
      <View style={styles.contentNoScroll}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '20%', backgroundColor: colors.accent }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {t('step_1_of_6_select_date_time')}
          </Text>
        </View>

        {/* City Header */}
        <View style={styles.cityHeader}>
          <Text style={[styles.cityName, { color: colors.textPrimary }]}>
            📍 {selectedCity}
          </Text>
          <Pressable 
            onPress={handleChangeCity}
            style={[styles.changeCityButton, { borderColor: colors.accent }]}
          >
            <Text style={[styles.changeCityText, { color: colors.accent }]}>
              Change City
            </Text>
          </Pressable>
        </View>

        {/* Combined Date & Time Layout */}
        <View style={styles.combinedRow}>
          {/* Inline Calendar */}
          <Card style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.monthHeader, { borderBottomColor: colors.cardBorder }]}> 
              <Pressable onPress={() => navigateMonth('prev')} style={styles.monthNavButton}>
                <ChevronLeft size={20} color={colors.textPrimary} />
              </Pressable>
              <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>
                {currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </Text>
              <Pressable onPress={() => navigateMonth('next')} style={styles.monthNavButton}>
                <ChevronRight size={20} color={colors.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.weekdayHeader}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text key={day} style={[styles.weekdayText, { color: colors.textSecondary }]}>
                  {day}
                </Text>
              ))}
            </View>

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
                      borderColor: day?.isToday ? colors.accent : colors.cardBorder,
                      opacity: !day || day.isDisabled ? 0.35 : 1,
                    }
                  ]}
                >
                  {day && (
                    <>
                      <Text style={[ 
                        styles.calendarDayText,
                        {
                          color: day.isSelected 
                            ? '#ffffff' 
                            : day.isToday 
                              ? colors.accent 
                              : colors.textPrimary
                        }
                      ]}>
                        {day.day}
                      </Text>
                      {day.hasCustomHours && !day.isSelected && (
                        <View style={[styles.activeDateIndicator, { backgroundColor: colors.accent }]} />
                      )}
                      {day.isInactive && !day.isSelected && (
                        <View style={styles.inactiveDateIndicator} />
                      )}
                    </>
                  )}
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Time Selector */}
          <Card style={[styles.timeCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.sectionHeader}>
              <Clock size={18} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('select_time_label')} *</Text>
            </View>

            {renderTimeSelector()}
          </Card>
        </View>
      </View>
      
      {/* Footer */}
      <BookingFooter
        onBack={() => navigation.goBack()}
        onContinue={handleContinue}
        continueText="Continue to Review"
      />
    </SafeAreaView>
  );
}