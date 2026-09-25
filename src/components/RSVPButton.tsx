import React from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { RSVPStatus } from '@/types/event';
import { Spacing } from '@/constants/theme';

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

  const handlePress = (newStatus: RSVPStatus) => {
    scale.value = withSequence(
      withSpring(0.92, { damping: 10 }),
      withSpring(1.04, { damping: 10 }),
      withSpring(1, { damping: 12 })
    );
    onRSVP(newStatus);
  };

  const isGoing = status === 'going';
  const isNotGoing = status === 'not-going';

  return (
    <View style={styles.container}>
      {/* Going button */}
      <AnimatedPressable
        style={[
          styles.button,
          styles.goingButton,
          isGoing && styles.goingActive,
          animatedStyle,
        ]}
        onPress={() => handlePress(isGoing ? null : 'going')}
        disabled={loading}
      >
        {loading && isGoing ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Text style={styles.buttonIcon}>{isGoing ? '✓' : '🎉'}</Text>
            <Text style={[styles.buttonText, isGoing && styles.activeText]}>
              {isGoing ? "You're Going!" : "I'm Going"}
            </Text>
          </>
        )}
      </AnimatedPressable>

      {/* Not Going button */}
      <AnimatedPressable
        style={[
          styles.button,
          styles.notGoingButton,
          isNotGoing && styles.notGoingActive,
        ]}
        onPress={() => handlePress(isNotGoing ? null : 'not-going')}
        disabled={loading}
      >
        {loading && isNotGoing ? (
          <ActivityIndicator color="#EF4444" size="small" />
        ) : (
          <Text style={[styles.buttonText, styles.notGoingText, isNotGoing && styles.notGoingActiveText]}>
            {isNotGoing ? '✕ Declined' : 'Can\'t Go'}
          </Text>
        )}
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
  },
  goingButton: {
    flex: 2,
    borderColor: '#6C63FF',
    backgroundColor: 'transparent',
  },
  goingActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  notGoingButton: {
    flex: 1,
    borderColor: '#EF4444',
    backgroundColor: 'transparent',
  },
  notGoingActive: {
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  buttonIcon: {
    fontSize: 16,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6C63FF',
  },
  activeText: {
    color: '#FFFFFF',
  },
  notGoingText: {
    color: '#EF4444',
  },
  notGoingActiveText: {
    color: '#EF4444',
  },
});
