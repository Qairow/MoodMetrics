import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../api/client';
import { colors } from '../../theme/colors';

interface Zone {
  id?: string;
  department: string;
  factor: string;
  score: number;
  status: 'ok' | 'risk' | 'critical';
  affectedEmployees?: number;
}

interface ZoneUser {
  id: string;
  name: string;
  department: string | null;
  role: string;
  position: string | null;
  score: number | null;
  zone: 'green' | 'yellow' | 'red';
  responsesCount: number;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  hr: 'HR',
  manager: 'Менеджер',
  employee: 'Сотрудник',
};

const statusColor = (s: string) => {
  if (s === 'ok' || s === 'green') return colors.green;
  if (s === 'risk' || s === 'yellow') return colors.yellow;
  if (s === 'critical' || s === 'red') return colors.red;
  return colors.textMuted;
};

const statusLabel = (s: string) => {
  if (s === 'ok' || s === 'green') return 'Норма';
  if (s === 'risk' || s === 'yellow') return 'Риск';
  if (s === 'critical' || s === 'red') return 'Критично';
  return s;
};

const FALLBACK_ZONES: Zone[] = [
  { department: 'Продажи', factor: 'Нагрузка / дедлайны', score: 72, status: 'risk', affectedEmployees: 12 },
  { department: 'Поддержка', factor: 'Конфликты / напряжение', score: 66, status: 'risk', affectedEmployees: 8 },
  { department: 'Разработка', factor: 'Усталость / выгорание', score: 58, status: 'ok', affectedEmployees: 15 },
  { department: 'HR', factor: 'Удовлетворённость', score: 82, status: 'ok', affectedEmployees: 4 },
];

export default function ZonesScreen() {
  const [zones, setZones] = useState<Zone[]>(FALLBACK_ZONES);
  const [users, setUsers] = useState<ZoneUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [zonesRes, usersRes] = await Promise.allSettled([
        api.get('/dashboard/problem-zones'),
        api.get('/zones/users'),
      ]);

      if (zonesRes.status === 'fulfilled') {
        const data = Array.isArray(zonesRes.value.data) ? zonesRes.value.data : [];
        if (data.length) setZones(data);
      }

      if (usersRes.status === 'fulfilled') {
        const data = Array.isArray(usersRes.value.data) ? usersRes.value.data : [];
        setUsers(data);
      }
    } catch {
      // keep fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  const critical = zones.filter(z => z.status === 'critical');
  const risk = zones.filter(z => z.status === 'risk');
  const ok = zones.filter(z => z.status === 'ok');

  const atRiskUsers = users.filter(u => u.zone !== 'green');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {loading ? (
        <View style={styles.loader}><ActivityIndicator color={colors.purple} size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.purple} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Зоны риска</Text>
            <Text style={styles.pageSub}>Проблемные области по отделам</Text>
          </View>

          {/* Summary row */}
          <View style={styles.summaryRow}>
            <SummaryChip count={critical.length} label="Критично" color={colors.red} />
            <SummaryChip count={risk.length} label="Риск" color={colors.yellow} />
            <SummaryChip count={ok.length} label="Норма" color={colors.green} />
          </View>

          {/* Zone cards */}
          {zones.map((z, i) => {
            const color = statusColor(z.status);
            return (
              <View key={z.id ?? i} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.dept}>{z.department}</Text>
                  <View style={[styles.badge, { backgroundColor: color + '20' }]}>
                    <Text style={[styles.badgeText, { color }]}>{statusLabel(z.status)}</Text>
                  </View>
                </View>
                <Text style={styles.factor}>{z.factor}</Text>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Индекс риска</Text>
                  <Text style={[styles.scoreValue, { color }]}>{z.score}</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${z.score}%` as any, backgroundColor: color }]} />
                </View>
                {z.affectedEmployees !== undefined && (
                  <Text style={styles.affected}>Затронуто сотрудников: {z.affectedEmployees}</Text>
                )}
              </View>
            );
          })}

          {/* At-risk users section */}
          {atRiskUsers.length > 0 && (
            <View style={styles.usersSection}>
              <Text style={styles.sectionTitle}>Сотрудники в зонах риска</Text>
              <Text style={styles.sectionSub}>{atRiskUsers.length} чел. требуют внимания</Text>
              {atRiskUsers.map(u => {
                const color = statusColor(u.zone);
                return (
                  <View key={u.id} style={styles.userCard}>
                    <View style={[styles.userAvatar, { backgroundColor: color + '20' }]}>
                      <Text style={[styles.userAvatarText, { color }]}>
                        {u.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{u.name}</Text>
                      <Text style={styles.userMeta}>
                        {u.department ?? '—'} · {ROLE_LABELS[u.role] ?? u.role}
                      </Text>
                    </View>
                    <View style={styles.userRight}>
                      {u.score !== null ? (
                        <Text style={[styles.userScore, { color }]}>{u.score}</Text>
                      ) : (
                        <Text style={styles.userScoreNa}>—</Text>
                      )}
                      <View style={[styles.userZoneBadge, { backgroundColor: color + '20' }]}>
                        <Text style={[styles.userZoneText, { color }]}>{statusLabel(u.zone)}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SummaryChip({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <View style={[chipSt.wrap, { backgroundColor: color + '15' }]}>
      <Text style={[chipSt.count, { color }]}>{count}</Text>
      <Text style={[chipSt.label, { color }]}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  header: { paddingTop: 16, paddingBottom: 16 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  pageSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },

  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  dept: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  factor: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  scoreLabel: { fontSize: 12, color: colors.textMuted },
  scoreValue: { fontSize: 13, fontWeight: '700' },
  progressBar: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', borderRadius: 4 },
  affected: { fontSize: 12, color: colors.textMuted },

  usersSection: { marginTop: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  sectionSub: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },

  userCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  userAvatarText: { fontSize: 16, fontWeight: '700' },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  userMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  userRight: { alignItems: 'flex-end', gap: 4 },
  userScore: { fontSize: 18, fontWeight: '900' },
  userScoreNa: { fontSize: 16, color: colors.textMuted },
  userZoneBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  userZoneText: { fontSize: 10, fontWeight: '600' },
});

const chipSt = StyleSheet.create({
  wrap: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center' },
  count: { fontSize: 22, fontWeight: '700' },
  label: { fontSize: 11, fontWeight: '500', marginTop: 2 },
});
