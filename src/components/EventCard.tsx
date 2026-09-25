import { router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';
import { Event } from '@/types/event';

// ─── Category pill colours ─────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  Technology: '#6C63FF',
  Music: '#FF6584',
  Sports: '#4CC9F0',
  Art: '#F9844A',
  Food: '#FFC75F',
  Business: '#208AEF',
  Health: '#90BE6D',
  Education: '#577590',
};

interface EventCardProps {
  event: Event;
  rsvpStatus?: 'going' | 'not-going' | null;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function EventCard({ event, rsvpStatus }: EventCardProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const handlePress = () => {
    router.push(`/events/${event.id}` as any);
  };

  // Format date
  const dateObj = new Date(event.date + 'T' + event.time);
  const formattedDate = dateObj.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const formattedTime = dateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const catColor = CATEGORY_COLORS[event.category] ?? '#6C63FF';

  return (
    <AnimatedPressable
      style={[
        styles.card,
        animatedStyle,
        isDark ? styles.cardDark : styles.cardLight,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <View style={[styles.band, { backgroundColor: event.coverColor }]}>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{event.category}</Text>
        </View>
        {rsvpStatus === 'going' && (
          <View style={styles.rsvpBadge}>
            <Text style={styles.rsvpBadgeText}>✓ Going</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text
          style={[styles.title, { color: isDark ? '#FFFFFF' : '#0D0D0D' }]}
          numberOfLines={2}
        >
          {event.title}
        </Text>

        <View style={styles.meta}>
          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📅</Text>
            <Text
              style={[
                styles.metaText,
                { color: isDark ? '#B0B4BA' : '#60646C' },
              ]}
            >
              {formattedDate} · {formattedTime}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text
              style={[
                styles.metaText,
                { color: isDark ? '#B0B4BA' : '#60646C' },
              ]}
              numberOfLines={1}
            >
              {event.location}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View
            style={[
              styles.attendeePill,
              { backgroundColor: isDark ? '#212225' : '#F0F0F3' },
            ]}
          >
            <Text style={[styles.attendeeText, { color: catColor }]}>
              👥 {event.attendees.toLocaleString('en-IN')} attending
            </Text>
          </View>
          <Text
            style={[
              styles.organizer,
              { color: isDark ? '#B0B4BA' : '#60646C' },
            ]}
          >
            by {event.organizer}
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: Spacing.three,
    marginVertical: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
  },
  cardDark: {
    backgroundColor: '#1A1A1E',
  },
  band: {
    height: 90,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: Spacing.three,
  },
  categoryPill: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  rsvpBadge: {
    backgroundColor: 'rgba(16,185,129,0.85)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rsvpBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  meta: {
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaIcon: {
    fontSize: 13,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  attendeePill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  attendeeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  organizer: {
    fontSize: 12,
    fontWeight: '500',
  },
});
