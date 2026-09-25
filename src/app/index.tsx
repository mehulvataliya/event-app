import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EventCard } from '@/components/EventCard';
import { BottomTabInset, Colors, Spacing } from '@/constants/theme';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchEvents } from '@/store/eventsSlice';
import { Event } from '@/types/event';

const CATEGORIES = [
  'All',
  'Technology',
  'Music',
  'Sports',
  'Art',
  'Food',
  'Business',
  'Health',
  'Education',
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function EventsListScreen() {
  const dispatch = useAppDispatch();
  const { list, listStatus, rsvpStatuses } = useAppSelector((s) => s.events);
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const fabScale = useSharedValue(1);
  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  useEffect(() => {
    if (listStatus === 'idle') {
      dispatch(fetchEvents());
    }
  }, [dispatch, listStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchEvents());
    setRefreshing(false);
  }, [dispatch]);

  // Filtered list
  const filteredEvents: Event[] = list.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFABPress = () => {
    fabScale.value = withSpring(0.88, { damping: 10 }, () => {
      fabScale.value = withSpring(1, { damping: 12 });
    });
    router.push('/events/create' as any);
  };

  const isLoading = listStatus === 'loading' && list.length === 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              Discover
            </Text>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Events
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.searchWrap,
            { backgroundColor: isDark ? '#212225' : '#F0F0F3' },
          ]}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search events or locations..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
                ✕
              </Text>
            </Pressable>
          )}
        </View>

        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          style={styles.chipList}
          contentContainerStyle={styles.chipContent}
          renderItem={({ item }) => {
            const active = item === selectedCategory;
            return (
              <Pressable
                onPress={() => setSelectedCategory(item)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active
                      ? '#6C63FF'
                      : isDark
                        ? '#212225'
                        : '#F0F0F3',
                    borderColor: active ? '#6C63FF' : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? '#fff' : colors.textSecondary },
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          }}
        />

        {isLoading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading events…
            </Text>
          </View>
        )}

        {!isLoading && (
          <FlatList
            data={filteredEvents}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: BottomTabInset + Spacing.six },
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#6C63FF"
                colors={['#6C63FF']}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🔭</Text>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  No events found
                </Text>
                <Text
                  style={[
                    styles.emptySubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Try a different search or category
                </Text>
              </View>
            }
            renderItem={({ item, index }) => (
              <Animated.View
                entering={FadeInDown.delay(index * 60).springify()}
              >
                <EventCard
                  event={item}
                  rsvpStatus={rsvpStatuses[item.id] ?? null}
                />
              </Animated.View>
            )}
          />
        )}
      </SafeAreaView>

      <AnimatedPressable
        style={[styles.fab, fabAnimStyle]}
        onPress={handleFABPress}
      >
        <Text style={styles.fabIcon}>＋</Text>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.three,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? 12 : 4,
    gap: 8,
    marginBottom: Spacing.two,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  chipList: {
    flexGrow: 0,
    marginBottom: Spacing.two,
  },
  chipContent: {
    paddingHorizontal: Spacing.three,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingTop: Spacing.one,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
    gap: Spacing.two,
  },
  emptyEmoji: {
    fontSize: 56,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: BottomTabInset + Spacing.three,
    right: Spacing.three,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
});
