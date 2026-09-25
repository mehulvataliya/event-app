import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';
import { RSVPStatus } from '@/types/event';

interface RSVPButtonProps {
  status: RSVPStatus;
  loading?: boolean;
  onRSVP: (newStatus: RSVPStatus) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function RSVPButton({ status, loading = false, onRSVP }: RSVPButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isBooked = status === 'going';

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.94, { damping: 10 }),
      withSpring(1.03, { damping: 10 }),
      withSpring(1, { damping: 12 }),
    );
    if (isBooked) {
      onRSVP(null);
    } else {
      onRSVP('going');
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedPressable
        style={[
          styles.button,
          isBooked ? styles.bookedButton : styles.bookButton,
          animatedStyle,
        ]}
        onPress={handlePress}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={isBooked ? '#EF4444' : '#FFFFFF'} size="small" />
        ) : isBooked ? (
          <>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>✓ Booked</Text>
            </View>
            <Text style={styles.cancelText}>Cancel Booking</Text>
          </>
        ) : (
          <>
            <Text style={styles.icon}>🎟️</Text>
            <Text style={styles.bookText}>Book Event</Text>
          </>
        )}
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: 16,
    paddingHorizontal: Spacing.four,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButton: {
    backgroundColor: '#6C63FF',
    shadowColor: '#6C63FF',
  },
  bookedButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    shadowColor: 'transparent',
  },
  icon: {
    fontSize: 18,
  },
  bookText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
});
