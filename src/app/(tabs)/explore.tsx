import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EventCard } from '@/components/EventCard';
import { BottomTabInset, Colors, Spacing } from '@/constants/theme';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchAllRSVPs, fetchEvents } from '@/store/eventsSlice';
import { Event } from '@/types/event';

export default function MyRSVPsScreen() {
  const dispatch = useAppDispatch();
  const { list, rsvpStatuses, rsvpsListStatus, listStatus } = useAppSelector(
    (s) => s.events,
  );
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const isLoading = rsvpsListStatus === 'loading' || listStatus === 'loading';

  useEffect(() => {
    if (listStatus === 'idle') dispatch(fetchEvents());
    dispatch(fetchAllRSVPs());
  }, [dispatch, listStatus]);

  const onRefresh = useCallback(async () => {
    await Promise.all([dispatch(fetchEvents()), dispatch(fetchAllRSVPs())]);
  }, [dispatch]);
  const goingEvents: Event[] = list.filter(
    (e) => rsvpStatuses[e.id] === 'going',
  );
  const notGoingEvents: Event[] = list.filter(
    (e) => rsvpStatuses[e.id] === 'not-going',
  );

  const rsvpCount = goingEvents.length + notGoingEvents.length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Your Plans
          </Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            My RSVPs
          </Text>
        </View>

        {isLoading && (
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading your RSVPs…
            </Text>
          </View>
        )}

        {!isLoading && (
          <FlatList
            data={[]}
            renderItem={null}
            keyExtractor={() => ''}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: BottomTabInset + Spacing.six },
            ]}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={onRefresh}
                tintColor="#6C63FF"
                colors={['#6C63FF']}
              />
            }
            ListHeaderComponent={
              <>
                {rsvpCount === 0 && (
                  <View style={styles.emptyWrap}>
                    <Text style={styles.emptyEmoji}>🎟️</Text>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>
                      No RSVPs yet
                    </Text>
                    <Text
                      style={[
                        styles.emptySubtitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Browse events and hit{' '}
                      <Text style={{ color: '#6C63FF', fontWeight: '700' }}>
                        Book Event
                      </Text>{' '}
                      to see them here.
                    </Text>
                    <Pressable
                      style={styles.browseBtn}
                      onPress={() => router.push('/(tabs)/' as any)}
                    >
                      <Text style={styles.browseBtnText}>Browse Events →</Text>
                    </Pressable>
                  </View>
                )}

                {goingEvents.length > 0 && (
                  <>
                    <SectionHeader
                      emoji="🎉"
                      title="Going"
                      count={goingEvents.length}
                      color="#10B981"
                    />
                    {goingEvents.map((event, index) => (
                      <Animated.View
                        key={event.id}
                        entering={FadeInDown.delay(index * 60).springify()}
                      >
                        <EventCard
                          event={event}
                          rsvpStatus={rsvpStatuses[event.id] ?? null}
                        />
                      </Animated.View>
                    ))}
                  </>
                )}

                {notGoingEvents.length > 0 && (
                  <>
                    <SectionHeader
                      emoji="😔"
                      title="Can't Go"
                      count={notGoingEvents.length}
                      color="#EF4444"
                    />
                    {notGoingEvents.map((event, index) => (
                      <Animated.View
                        key={event.id}
                        entering={FadeInDown.delay(
                          (goingEvents.length + index) * 60,
                        ).springify()}
                      >
                        <EventCard
                          event={event}
                          rsvpStatus={rsvpStatuses[event.id] ?? null}
                        />
                      </Animated.View>
                    ))}
                  </>
                )}
              </>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

// ─── SectionHeader ─────────────────────────────────────────────────────────────
function SectionHeader({
  emoji,
  title,
  count,
  color,
}: {
  emoji: string;
  title: string;
  count: number;
  color: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionEmoji}>{emoji}</Text>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      <View style={[styles.sectionBadge, { backgroundColor: color + '22' }]}>
        <Text style={[styles.sectionCount, { color }]}>{count}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  headerSub: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  content: { paddingTop: Spacing.two },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: 80,
  },
  loadingText: { fontSize: 15, fontWeight: '500' },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 80,
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 22, fontWeight: '800' },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  browseBtn: {
    marginTop: Spacing.two,
    backgroundColor: '#6C63FF',
    paddingHorizontal: Spacing.four,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  browseBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
  sectionEmoji: { fontSize: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', flex: 1 },
  sectionBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  sectionCount: { fontSize: 14, fontWeight: '700' },
});
