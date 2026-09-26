import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Yup from 'yup';

import { UserProfileModal } from '@/components/UserProfileModal';
import { Colors, Spacing } from '@/constants/theme';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  clearSubmitStatus,
  createEvent,
  fetchEventById,
  updateEvent,
} from '@/store/eventsSlice';
import { promptUserProfile } from '@/store/userSlice';
import { EventCategory, EventFormValues } from '@/types/event';

const CATEGORIES: EventCategory[] = [
  'Technology',
  'Music',
  'Sports',
  'Art',
  'Food',
  'Business',
  'Health',
  'Education',
];

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDisplayTime(timeStr: string): string {
  if (!timeStr) return '';
  try {
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return timeStr;
    const dateObj = new Date();
    dateObj.setHours(h, m);
    return dateObj.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return timeStr;
  }
}

const validationSchema = Yup.object({
  title: Yup.string()
    .min(3, 'At least 3 characters')
    .required('Title is required'),
  description: Yup.string()
    .min(10, 'At least 10 characters')
    .required('Description is required'),
  date: Yup.string()
    .required('Date is required')
    .test('future', 'Date must be today or in the future', (val) => {
      if (!val) return false;
      const [y, m, d] = val.split('-').map(Number);
      if (!y || !m || !d) return false;
      const selected = new Date(y, m - 1, d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected >= today;
    }),
  time: Yup.string().required('Time is required'),
  location: Yup.string().required('Location is required'),
  category: Yup.string().required('Category is required'),
});

export default function CreateEventScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const dispatch = useAppDispatch();
  const { selectedEvent, submitStatus } = useAppSelector((s) => s.events);
  const user = useAppSelector((s) => s.user.user);
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      dispatch(fetchEventById(id));
    }
    return () => {
      dispatch(clearSubmitStatus());
    };
  }, [id, isEditMode, dispatch]);

  // Verify ownership in edit mode
  useEffect(() => {
    if (isEditMode && selectedEvent) {
      const isOwner = Boolean(
        user?.userId &&
          selectedEvent?.organizerId &&
          String(user.userId) === String(selectedEvent.organizerId),
      );
      if (!isOwner) {
        Alert.alert(
          'Permission Denied',
          'Only the creator of this event can edit it.',
        );
        router.back();
      }
    }
  }, [isEditMode, selectedEvent, user]);

  // On successful submit, go back
  useEffect(() => {
    if (submitStatus === 'succeeded') {
      router.back();
    }
  }, [submitStatus]);

  const initialValues: EventFormValues = {
    title: isEditMode && selectedEvent ? selectedEvent.title : '',
    description: isEditMode && selectedEvent ? selectedEvent.description : '',
    date: isEditMode && selectedEvent ? selectedEvent.date : '',
    time: isEditMode && selectedEvent ? selectedEvent.time : '',
    location: isEditMode && selectedEvent ? selectedEvent.location : '',
    category: isEditMode && selectedEvent ? selectedEvent.category : '',
  };

  const formik = useFormik<EventFormValues>({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      if (isEditMode && id) {
        dispatch(updateEvent({ id, values }));
      } else {
        if (!user) {
          dispatch(promptUserProfile({ type: 'create_event' }));
          return;
        }
        dispatch(createEvent(values));
      }
    },
  });

  const currentDateValue = (() => {
    if (formik.values.date) {
      const [y, m, d] = formik.values.date.split('-').map(Number);
      if (y && m && d) return new Date(y, m - 1, d);
    }
    const tm = new Date();
    tm.setDate(tm.getDate() + 1);
    return tm;
  })();

  const currentTimeValue = (() => {
    if (formik.values.time) {
      const [h, m] = formik.values.time.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        const dt = new Date();
        dt.setHours(h, m, 0, 0);
        return dt;
      }
    }
    const dt = new Date();
    dt.setHours(10, 0, 0, 0);
    return dt;
  })();

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate && event.type !== 'dismissed') {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      formik.setFieldValue('date', `${year}-${month}-${day}`);
      formik.setFieldTouched('date', true);
    }
  };

  const handleTimeChange = (
    event: DateTimePickerEvent,
    selectedTime?: Date,
  ) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime && event.type !== 'dismissed') {
      const hours = String(selectedTime.getHours()).padStart(2, '0');
      const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
      formik.setFieldValue('time', `${hours}:${minutes}`);
      formik.setFieldTouched('time', true);
    }
  };

  const inputBg = isDark ? '#212225' : '#F0F0F3';
  const borderColor = isDark ? '#2E3135' : '#E0E1E6';
  const isLoading = submitStatus === 'loading';

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView
        edges={['top']}
        style={{ backgroundColor: colors.background }}
      >
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={[styles.backText, { color: '#6C63FF' }]}>
              ← Cancel
            </Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isEditMode ? 'Edit Event' : 'New Event'}
          </Text>
          <View style={{ width: 70 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <FormField
            label="Event Title"
            placeholder="e.g. React Native Summit"
            value={formik.values.title}
            onChangeText={formik.handleChange('title')}
            onBlur={formik.handleBlur('title')}
            error={formik.touched.title ? formik.errors.title : undefined}
            inputBg={inputBg}
            borderColor={borderColor}
            textColor={colors.text}
            placeholderColor={colors.textSecondary}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <FormField
            label="Description"
            placeholder="What's this event about?"
            value={formik.values.description}
            onChangeText={formik.handleChange('description')}
            onBlur={formik.handleBlur('description')}
            error={
              formik.touched.description ? formik.errors.description : undefined
            }
            multiline
            numberOfLines={4}
            inputBg={inputBg}
            borderColor={borderColor}
            textColor={colors.text}
            placeholderColor={colors.textSecondary}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(140).springify()}
          style={styles.row}
        >
          <View style={{ flex: 1 }}>
            <PickerTriggerField
              label="Date"
              placeholder="Select Date"
              value={formatDisplayDate(formik.values.date)}
              icon="📅"
              onPress={() => setShowDatePicker(true)}
              error={formik.touched.date ? formik.errors.date : undefined}
              inputBg={inputBg}
              borderColor={borderColor}
              textColor={colors.text}
              placeholderColor={colors.textSecondary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <PickerTriggerField
              label="Time"
              placeholder="Select Time"
              value={formatDisplayTime(formik.values.time)}
              icon="⏰"
              onPress={() => setShowTimePicker(true)}
              error={formik.touched.time ? formik.errors.time : undefined}
              inputBg={inputBg}
              borderColor={borderColor}
              textColor={colors.text}
              placeholderColor={colors.textSecondary}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).springify()}>
          <FormField
            label="Location"
            placeholder="Venue name and city"
            value={formik.values.location}
            onChangeText={formik.handleChange('location')}
            onBlur={formik.handleBlur('location')}
            error={formik.touched.location ? formik.errors.location : undefined}
            inputBg={inputBg}
            borderColor={borderColor}
            textColor={colors.text}
            placeholderColor={colors.textSecondary}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220).springify()}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Category
          </Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const active = formik.values.category === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => formik.setFieldValue('category', cat)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: active ? '#6C63FF' : inputBg,
                      borderColor: active ? '#6C63FF' : borderColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: active ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {formik.touched.category && formik.errors.category && (
            <Text style={styles.errorText}>{formik.errors.category}</Text>
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(260).springify()}
          style={{ marginTop: Spacing.three }}
        >
          <Pressable
            style={[styles.submitBtn, isLoading && styles.submitBtnLoading]}
            onPress={() => formik.handleSubmit()}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isEditMode ? 'Save Changes' : '🎉 Create Event'}
              </Text>
            )}
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Date Picker Modal/Component */}
      {showDatePicker &&
        (Platform.OS === 'android' ? (
          <DateTimePicker
            value={currentDateValue}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        ) : (
          <Modal
            transparent
            animationType="slide"
            visible={showDatePicker}
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.pickerModalOverlay}>
              <Pressable
                style={styles.pickerModalBackdrop}
                onPress={() => setShowDatePicker(false)}
              />
              <View
                style={[
                  styles.pickerModalCard,
                  { backgroundColor: isDark ? '#1F2023' : '#FFFFFF' },
                ]}
              >
                <View style={styles.pickerModalHeader}>
                  <Text style={[styles.pickerModalTitle, { color: colors.text }]}>
                    Select Date
                  </Text>
                  <Pressable
                    style={styles.pickerDoneBtn}
                    onPress={() => {
                      if (!formik.values.date) {
                        const year = currentDateValue.getFullYear();
                        const month = String(currentDateValue.getMonth() + 1).padStart(2, '0');
                        const day = String(currentDateValue.getDate()).padStart(2, '0');
                        formik.setFieldValue('date', `${year}-${month}-${day}`);
                      }
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={styles.pickerDoneText}>Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={currentDateValue}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  textColor={colors.text}
                  style={{ height: 200 }}
                />
              </View>
            </View>
          </Modal>
        ))}

      {/* Time Picker Modal/Component */}
      {showTimePicker &&
        (Platform.OS === 'android' ? (
          <DateTimePicker
            value={currentTimeValue}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        ) : (
          <Modal
            transparent
            animationType="slide"
            visible={showTimePicker}
            onRequestClose={() => setShowTimePicker(false)}
          >
            <View style={styles.pickerModalOverlay}>
              <Pressable
                style={styles.pickerModalBackdrop}
                onPress={() => setShowTimePicker(false)}
              />
              <View
                style={[
                  styles.pickerModalCard,
                  { backgroundColor: isDark ? '#1F2023' : '#FFFFFF' },
                ]}
              >
                <View style={styles.pickerModalHeader}>
                  <Text style={[styles.pickerModalTitle, { color: colors.text }]}>
                    Select Time
                  </Text>
                  <Pressable
                    style={styles.pickerDoneBtn}
                    onPress={() => {
                      if (!formik.values.time) {
                        const hours = String(currentTimeValue.getHours()).padStart(2, '0');
                        const minutes = String(currentTimeValue.getMinutes()).padStart(2, '0');
                        formik.setFieldValue('time', `${hours}:${minutes}`);
                      }
                      setShowTimePicker(false);
                    }}
                  >
                    <Text style={styles.pickerDoneText}>Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={currentTimeValue}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                  textColor={colors.text}
                  style={{ height: 200 }}
                />
              </View>
            </View>
          </Modal>
        ))}

      <UserProfileModal />
    </KeyboardAvoidingView>
  );
}

// ─── FormField ────────────────────────────────────────────────────────────────
interface FormFieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (t: string) => void;
  onBlur: (e?: any) => void;
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  inputBg: string;
  borderColor: string;
  textColor: string;
  placeholderColor: string;
}
function FormField({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  error,
  multiline,
  numberOfLines,
  inputBg,
  borderColor,
  textColor,
  placeholderColor,
}: FormFieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: placeholderColor }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          {
            backgroundColor: inputBg,
            borderColor: error ? '#EF4444' : borderColor,
            color: textColor,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ─── PickerTriggerField ───────────────────────────────────────────────────────
interface PickerTriggerFieldProps {
  label: string;
  placeholder: string;
  value: string;
  icon: string;
  onPress: () => void;
  error?: string;
  inputBg: string;
  borderColor: string;
  textColor: string;
  placeholderColor: string;
}

function PickerTriggerField({
  label,
  placeholder,
  value,
  icon,
  onPress,
  error,
  inputBg,
  borderColor,
  textColor,
  placeholderColor,
}: PickerTriggerFieldProps) {
  const hasValue = Boolean(value);
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: placeholderColor }]}>{label}</Text>
      <Pressable
        style={[
          styles.pickerTrigger,
          {
            backgroundColor: inputBg,
            borderColor: error ? '#EF4444' : borderColor,
          },
        ]}
        onPress={onPress}
      >
        <Text style={{ fontSize: 16 }}>{icon}</Text>
        <Text
          style={[
            styles.pickerTriggerText,
            { color: hasValue ? textColor : placeholderColor },
          ]}
          numberOfLines={1}
        >
          {hasValue ? value : placeholder}
        </Text>
      </Pressable>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  backBtn: { width: 70 },
  backText: { fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700' },

  form: {
    padding: Spacing.three,
    gap: Spacing.two,
    paddingBottom: 60,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  fieldWrap: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: 12,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
  },
  pickerTriggerText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: 6,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnLoading: {
    opacity: 0.75,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Picker Modal Styles
  pickerModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerModalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  pickerModalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.three,
    paddingBottom: Spacing.five,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
    marginBottom: Spacing.two,
  },
  pickerModalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  pickerDoneBtn: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  pickerDoneText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
