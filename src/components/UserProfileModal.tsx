import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { router } from 'expo-router';

import { Colors, Spacing } from '@/constants/theme';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchAllRSVPs, rsvpEvent } from '@/store/eventsSlice';
import {
  closeProfileModal,
  saveUserProfile,
} from '@/store/userSlice';

export function UserProfileModal() {
  const dispatch = useAppDispatch();
  const { user, isModalVisible, pendingAction } = useAppSelector(
    (s) => s.user,
  );
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [usernameInput, setUsernameInput] = useState(user?.username || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    const trimmed = usernameInput.trim();
    if (!trimmed || trimmed.length < 2) {
      setError('Please enter a valid name (at least 2 characters)');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await dispatch(saveUserProfile(trimmed)).unwrap();
      dispatch(fetchAllRSVPs());
      setIsSubmitting(false);

      // Execute pending action after saving user profile
      if (pendingAction) {
        if (pendingAction.type === 'create_event') {
          router.push('/events/create' as any);
        } else if (pendingAction.type === 'rsvp_event') {
          dispatch(
            rsvpEvent({ id: pendingAction.eventId, status: 'going' }),
          );
        }
      }
    } catch {
      setIsSubmitting(false);
      setError('Failed to save profile. Please try again.');
    }
  };

  const handleClose = () => {
    dispatch(closeProfileModal());
    setError('');
  };

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#1F2023' : '#FFFFFF',
              borderColor: isDark ? '#2E3135' : '#E5E7EB',
            },
          ]}
        >
          <View style={styles.iconBadge}>
            <Text style={styles.iconEmoji}>👤</Text>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {user ? 'Edit Profile' : 'Welcome! Enter your name'}
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your name will be associated with events you organize and book.
          </Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Your Full Name / Username
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#2B2C30' : '#F3F4F6',
                  color: colors.text,
                  borderColor: error ? '#EF4444' : isDark ? '#3A3D42' : '#D1D5DB',
                },
              ]}
              placeholder="e.g. Mehul Vataliya"
              placeholderTextColor={colors.textSecondary}
              value={usernameInput}
              onChangeText={(val) => {
                setUsernameInput(val);
                if (error) setError('');
              }}
              autoCapitalize="words"
              autoFocus
            />
            {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <View style={styles.actions}>
            <Pressable
              style={[
                styles.cancelBtn,
                { backgroundColor: isDark ? '#2B2C30' : '#F3F4F6' },
              ]}
              onPress={handleClose}
            >
              <Text style={[styles.cancelBtnText, { color: colors.text }]}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              style={[styles.saveBtn, isSubmitting && styles.btnDisabled]}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save & Continue</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#6C63FF18',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 4,
  },
  iconEmoji: {
    fontSize: 26,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.one,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1.5,
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.7,
  },
});
