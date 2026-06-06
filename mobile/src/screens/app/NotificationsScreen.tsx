import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../api/client';
import { colors } from '../../theme/colors';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  read: boolean;
  createdAt: string;
}

const typeConfig: Record<string, { color: string; icon: string }> = {
  info: { color: colors.purple, icon: 'ℹ️' },
  warning: { color: colors.yellow, icon: '⚠️' },
  critical: { color: colors.red, icon: '🔴' },
  success: { color: colors.green, icon: '✅' },
};

const FALLBACK: Notification[] = [
  {
    id: '1',
    title: 'Новый опрос доступен',
    message: 'Пульс-опрос для отдела Продажи запущен. Пожалуйста, пройдите его.',
    type: 'info',
    read: false,
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
  },
  {
    id: '2',
    title: 'Риск выгорания в Разработке',
    message: 'Индекс выгорания вырос до 75%. Рекомендуем провести 1:1 встречи.',
    type: 'warning',
    read: false,
    createdAt: new Date(Date.now() - 86400_000).toISOString(),
  },
  {
    id: '3',
    title: 'Охват опроса достиг 80%',
    message: 'Отличный результат! Данные репрезентативны для всех отделов.',
    type: 'success',
    read: true,
    createdAt: new Date(Date.now() - 172800_000).toISOString(),
  },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}

export default function NotificationsScreen() {
  const [items, setItems] = useState<Notification[]>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/notifications');
      const data = Array.isArray(res.data) ? res.data
        : Array.isArray(res.data?.notifications) ? res.data.notifications
        : [];
      if (data.length) setItems(data);
    } catch {
      // keep fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  const markRead = async (id: string) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try { await api.patch(`/notifications/${id}/read`); } catch {}
  };

  const unread = items.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Уведомления</Text>
          <Text style={styles.pageSub}>
            {unread > 0 ? `${unread} непрочитанных` : 'Все прочитаны'}
          </Text>
        </View>
        {unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unread}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator color={colors.purple} size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.purple} />}
          showsVerticalScrollIndicator={false}
        >
          {items.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>Нет уведомлений</Text>
            </View>
          ) : (
            items.map((n) => {
              const cfg = typeConfig[n.type] ?? typeConfig.info;
              return (
                <TouchableOpacity
                  key={n.id}
                  style={[styles.card, !n.read && styles.cardUnread]}
                  onPress={() => markRead(n.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardLeft}>
                    <View style={[styles.iconBox, { backgroundColor: cfg.color + '15' }]}>
                      <Text style={styles.icon}>{cfg.icon}</Text>
                    </View>
                    {!n.read && <View style={[styles.dot, { backgroundColor: cfg.color }]} />}
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{n.title}</Text>
                      <Text style={styles.cardTime}>{timeAgo(n.createdAt)}</Text>
                    </View>
                    <Text style={styles.cardMsg} numberOfLines={2}>{n.message}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  pageTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  pageSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  unreadBadge: {
    backgroundColor: colors.purple,
    borderRadius: 12,
    minWidth: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textMuted, fontSize: 15 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: colors.purple },
  cardLeft: { width: 44, alignItems: 'center', marginRight: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, flex: 1, marginRight: 8 },
  cardTime: { fontSize: 11, color: colors.textMuted },
  cardMsg: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
});
