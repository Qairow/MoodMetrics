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
  trend?: string;
}

const statusColor = (s: string) => {
  if (s === 'ok') return colors.green;
  if (s === 'risk') return colors.yellow;
  if (s === 'critical') return colors.red;
  return colors.textMuted;
};

const statusLabel = (s: string) => {
  if (s === 'ok') return 'Норма';
  if (s === 'risk') return 'Риск';
  if (s === 'critical') return 'Критично';
  return s;
};

const FALLBACK: Zone[] = [
  { department: 'Продажи', factor: 'Нагрузка / дедлайны', score: 72, status: 'risk', affectedEmployees: 12 },
  { department: 'Поддержка', factor: 'Конфликты / напряжение', score: 66, status: 'risk', affectedEmployees: 8 },
  { department: 'Разработка', factor: 'Усталость / выгорание', score: 58, status: 'ok', affectedEmployees: 15 },
  { department: 'HR', factor: 'Удовлетворённость', score: 82, status: 'ok', affectedEmployees: 4 },
];

export default function ZonesScreen() {
  const [zones, setZones] = useState<Zone[]>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/dashboard/problem-zones');
      const data = Array.isArray(res.data) ? res.data : [];
      if (data.length) setZones(data);
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

          {/* All zones */}
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
                  <Text style={styles.scoreLabel}>Индекс</Text>
                  <Text style={[styles.scoreValue, { color }]}>{z.score}</Text>
                </View>

                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${z.score}%` as any, backgroundColor: color },
                    ]}
                  />
                </View>

                {z.affectedEmployees !== undefined && (
                  <Text style={styles.affected}>
                    Затронуто сотрудников: {z.affectedEmployees}
                  </Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SummaryChip({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <View style={[chipStyles.wrap, { backgroundColor: color + '15' }]}>
      <Text style={[chipStyles.count, { color }]}>{count}</Text>
      <Text style={[chipStyles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
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
});

const chipStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  count: { fontSize: 22, fontWeight: '700' },
  label: { fontSize: 11, fontWeight: '500', marginTop: 2 },
});
