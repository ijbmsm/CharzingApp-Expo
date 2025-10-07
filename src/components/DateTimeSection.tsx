import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

interface CalendarDay {
  dateString: string;
  day: number;
  month: number;
  year: number;
  timestamp: number;
}

interface DateTimeSectionProps {
  selectedDate: string;
  selectedTimeSlot: string;
  timeSlots: TimeSlot[];
  onDateSelect: (day: CalendarDay) => void;
  onTimeSlotSelect: (timeSlotId: string) => void;
  formatDate: (dateString: string) => string;
  isLoadingTimeSlots?: boolean;
  noPadding?: boolean;
}

const DateTimeSection: React.FC<DateTimeSectionProps> = ({
  selectedDate,
  selectedTimeSlot,
  timeSlots,
  onDateSelect,
  onTimeSlotSelect,
  formatDate,
  isLoadingTimeSlots = false,
  noPadding = false,
}) => {
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 30);


  // 캘린더 테마 설정
  const calendarTheme = {
    backgroundColor: '#ffffff',
    calendarBackground: '#ffffff',
    textSectionTitleColor: '#b6c1cd',
    selectedDayBackgroundColor: '#4495E8',
    selectedDayTextColor: '#ffffff',
    todayTextColor: '#4495E8',
    dayTextColor: '#2d4150',
    textDisabledColor: '#d9e1e8',
    dotColor: '#00adf5',
    selectedDotColor: '#ffffff',
    arrowColor: '#4495E8',
    disabledArrowColor: '#d9e1e8',
    monthTextColor: '#2d4150',
    indicatorColor: '#4495E8',
    textDayFontFamily: 'System',
    textMonthFontFamily: 'System',
    textDayHeaderFontFamily: 'System',
    textDayFontWeight: '400' as '400',
    textMonthFontWeight: 'bold' as 'bold',
    textDayHeaderFontWeight: '400' as '400',
    textDayFontSize: 16,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 13,
  };

  // 선택된 날짜 표시
  const getMarkedDates = () => {
    const marked: any = {};
    
    // 선택된 날짜 표시
    if (selectedDate) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: '#4495E8',
        textColor: '#FFFFFF',
      };
    }
    
    return marked;
  };

  return (
    <View style={[styles.container, noPadding && styles.noPaddingContainer]}>
      {/* 날짜 선택 */}
      <View style={styles.calendarSection}>
        <Text style={styles.sectionTitle}>예약 날짜 선택</Text>
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={onDateSelect}
            markedDates={getMarkedDates()}
            minDate={today.toISOString().split('T')[0]}
            maxDate={maxDate.toISOString().split('T')[0]}
            theme={calendarTheme}
            firstDay={0}
            monthFormat={'yyyy년 M월'}
            hideExtraDays={true}
            disableMonthChange={false}
            hideArrows={false}
            hideDayNames={false}
            showWeekNumbers={false}
            disabledByDefault={false}
          />
        </View>
      </View>

      {/* 시간 선택 */}
      {selectedDate && (
        <View style={styles.timeSection}>
          <Text style={styles.sectionTitle}>
            {formatDate(selectedDate)} 예약 가능 시간
          </Text>
          
          {isLoadingTimeSlots ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4495E8" />
              <Text style={styles.loadingText}>예약 가능 시간을 불러오는 중...</Text>
            </View>
          ) : (
            <>
              <View style={styles.timeSlotGrid}>
                {timeSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot.id}
                    style={[
                      styles.timeSlot,
                      !slot.available && styles.timeSlotDisabled,
                      selectedTimeSlot === slot.id && styles.timeSlotSelected,
                    ]}
                    onPress={() => slot.available && onTimeSlotSelect(slot.id)}
                    disabled={!slot.available}
                  >
                    <Text
                      style={[
                        styles.timeSlotText,
                        !slot.available && styles.timeSlotTextDisabled,
                        selectedTimeSlot === slot.id && styles.timeSlotTextSelected,
                      ]}
                    >
                      {slot.time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {timeSlots.filter(slot => slot.available).length === 0 && (
                <View style={styles.noAvailableTime}>
                  <Text style={styles.noAvailableTimeText}>
                    선택한 날짜에 예약 가능한 시간이 없습니다.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  noPaddingContainer: {
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  calendarSection: {
    marginBottom: 16,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  timeSection: {
    marginBottom: 16,
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  timeSlot: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  timeSlotSelected: {
    backgroundColor: '#4495E8',
    borderColor: '#4495E8',
  },
  timeSlotDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  timeSlotTextDisabled: {
    color: '#9CA3AF',
  },
  noAvailableTime: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  noAvailableTimeText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginTop: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default DateTimeSection;