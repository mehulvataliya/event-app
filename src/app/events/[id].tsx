import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RSVPButton } from '@/components/RSVPButton';
import { BottomTabInset, Colors, Spacing } from '@/constants/theme';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  clearSelectedEvent,
  fetchEventById,
  rsvpEvent,
} from '@/store/eventsSlice';
import { RSVPStatus } from '@/types/event';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { selectedEvent, detailStatus, rsvpStatuses, rsvpStatus } =
    useAppSelector((s) => s.events);
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const currentRSVP: RSVPStatus = rsvpStatuses[id] ?? null;
  const isRSVPLoading = rsvpStatus === 'loading';

  useEffect(() => {
    if (id) {
      dispatch(fetchEventById(id));
    }
    return () => {
      dispatch(clearSelectedEvent());
    };
  }, [id, dispatch]);

  const handleRSVP = (newStatus: RSVPStatus) => {
    if (id) {
      dispatch(rsvpEvent({ id, status: newStatus }));
    }
  };

  const handleEdit = () => {
    router.push(`/events/create?id=${id}` as any);
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (detailStatus === 'loading' || detailStatus === 'idle') {
    return (
      <View style={[styles.centerWrap, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading event…
        </Text>
      </View>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (detailStatus === 'failed' || !selectedEvent) {
    return (
      <View style={[styles.centerWrap, { backgroundColor: colors.background }]}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          Event not found
        </Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const e = selectedEvent;

  // Format date/time
  const dateObj = new Date(`${e.date}T${e.time}`);
  const fullDate = dateObj.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const fullTime = dateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const cardBg = isDark ? '#1A1A1E' : '#FFFFFF';
  const sectionBg = isDark ? '#212225' : '#F6F6FA';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BottomTabInset + 120 }}
      >
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[styles.heroBanner, { backgroundColor: e.coverColor }]}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.heroNav}>
              <Pressable style={styles.navBtn} onPress={() => router.back()}>
                <Text style={styles.navBtnText}>←</Text>
              </Pressable>
              <Pressable style={styles.navBtn} onPress={handleEdit}>
                <Text style={styles.navBtnText}>✎</Text>
              </Pressable>
            </View>
          </SafeAreaView>

          <View style={styles.heroCategoryBadge}>
            <Text style={styles.heroCategoryText}>{e.category}</Text>
          </View>

          <Animated.Text
            entering={FadeInDown.delay(150).springify()}
            style={styles.heroTitle}
          >
            {e.title}
          </Animated.Text>

          <Animated.Text
            entering={FadeInDown.delay(220).springify()}
            style={styles.heroAttendees}
          >
            👥 {e.attendees.toLocaleString('en-IN')} attending
          </Animated.Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={[styles.body, { backgroundColor: colors.background }]}
        >
          <View style={styles.infoRow}>
            <InfoCard
              icon="📅"
              label="Date"
              value={fullDate}
              bg={sectionBg}
              textColor={colors.text}
              subColor={colors.textSecondary}
            />
          </View>
          <View style={styles.infoRow}>
            <InfoCard
              icon="🕐"
              label="Time"
              value={fullTime}
              bg={sectionBg}
              textColor={colors.text}
              subColor={colors.textSecondary}
            />
            <InfoCard
              icon="🏢"
              label="Organizer"
              value={e.organizer}
              bg={sectionBg}
              textColor={colors.text}
              subColor={colors.textSecondary}
            />
          </View>

          <View style={[styles.locationCard, { backgroundColor: sectionBg }]}>
            <Text style={styles.locationIcon}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Location
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {e.location}
              </Text>
            </View>
          </View>

          <View style={[styles.descCard, { backgroundColor: sectionBg }]}>
            <Text style={[styles.descTitle, { color: colors.text }]}>
              About this event
            </Text>
            <Text style={[styles.descText, { color: colors.textSecondary }]}>
              {e.description}
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: e.coverColor + '22',
                borderColor: e.coverColor + '44',
              },
            ]}
          >
            <Text style={[styles.statNumber, { color: e.coverColor }]}>
              {e.attendees.toLocaleString('en-IN')}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              People are attending this event
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInDown.delay(400).springify()}
        style={[
          styles.rsvpFooter,
          {
            backgroundColor: cardBg,
            borderTopColor: isDark ? '#2E3135' : '#E5E7EB',
          },
        ]}
      >
        <SafeAreaView edges={['bottom']}>
          <View style={styles.rsvpInner}>
            <Text style={[styles.rsvpLabel, { color: colors.textSecondary }]}>
              {currentRSVP === 'going'
                ? "🎉 You're on the list!"
                : currentRSVP === 'not-going'
                  ? '😔 Maybe next time'
                  : 'Will you attend?'}
            </Text>
            <RSVPButton
              status={currentRSVP}
              loading={isRSVPLoading}
              onRSVP={handleRSVP}
            />
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}
interface InfoCardProps {
  icon: string;
  label: string;
  value: string;
  bg: string;
  textColor: string;
  subColor: string;
}
function InfoCard({
  icon,
  label,
  value,
  bg,
  textColor,
  subColor,
}: InfoCardProps) {
  return (
    <View style={[styles.infoCard, { backgroundColor: bg }]}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={[styles.infoLabel, { color: subColor }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: textColor }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
  },
  errorEmoji: { fontSize: 52 },
  errorTitle: { fontSize: 20, fontWeight: '700' },
  backBtn: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: 10,
    backgroundColor: '#6C63FF',
    borderRadius: 12,
  },
  backBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  // Hero
  heroBanner: {
    minHeight: 260,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
  heroNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  heroCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  heroCategoryText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroAttendees: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
  },

  // Body
  body: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  infoCard: {
    flex: 1,
    borderRadius: 16,
    padding: Spacing.three,
    gap: 4,
  },
  infoIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },

  // Location
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 16,
    padding: Spacing.three,
  },
  locationIcon: {
    fontSize: 28,
  },

  // Description
  descCard: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  descTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  descText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
  },

  // Stat
  statCard: {
    borderRadius: 16,
    padding: Spacing.four,
    alignItems: 'center',
    borderWidth: 1.5,
    gap: 6,
  },
  statNumber: {
    fontSize: 40,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  // RSVP footer
  rsvpFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  rsvpInner: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  rsvpLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
