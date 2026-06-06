import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { api } from '../../api/client';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import type { DashboardMetrics, ProblemZone, StatusType } from '../../types';

const SCREEN_W = Dimensions.get('window').width;

const statusColor = (s: string): string => {
  if (s === 'ok' || s === 'low') return colors.green;
  if (s === 'risk') return colors.yellow;
  if (s === 'critical') return colors.red;
  return colors.textMuted;
};

const statusLabel = (s: string): string => {
  if (s === 'ok' || s === 'low') return 'Ок';
  if (s === 'risk') return 'Риск';
  if (s === 'critical') return 'Критично';
  return s;
};

const FALLBACK_METRICS: DashboardMetrics = {
  wellbeingIndex: { overall: 74, status: 'risk' },
  burnoutRisk: { value: 31, status: 'low' },
  tensionConflicts: { value: 18, status: 'risk' },
  surveyCoverage: { value: 62, period: '14 дней' },
};

const FALLBACK_CHART = [70, 72, 71, 73, 74, 74, 73, 74];
const FALLBACK_LABELS = ['8н', '7н', '6н', '5н', '4н', '3н', '2н', 'Тек'];

const FALLBACK_ZONES: ProblemZone[] = [
  { department: 'Продажи', factor: 'Нагрузка/сроки', score: 72, status: 'risk' },
  { department: 'Поддержка', factor: 'Конфликты/напряжение', score: 66, status: 'risk' },
  { department: 'Разработка', factor: 'Усталость/выгорание', score: 58, status: 'ok' },
];

// ─── Chart component ─────────────────────────────────────────────────────────

function NativeChart({ data, labels }: { data: number[]; labels: string[] }) {
  if (Platform.OS === 'web') {
    // Web: bar fallback (SVG chart sometimes fails on web Metro bundle)
    const max = Math.max(...data, 1);
    return (
      <View style={chartFallback.wrap}>
        {data.map((v, i) => (
          <View key={i} style={chartFallback.col}>
            <View style={chartFallback.barWrap}>
              <View style={[chartFallback.bar, { height: Math.round((v / max) * 100) }]} />
            </View>
            <Text style={chartFallback.label}>{labels[i]}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <LineChart
      data={{ labels, datasets: [{ data }] }}
      width={SCREEN_W - 72}
      height={180}
      chartConfig={{
        backgroundGradientFrom: colors.bgSecondary,
        backgroundGradientTo: colors.bgSecondary,
        color: () => colors.purple,
        labelColor: () => colors.textSecondary,
        strokeWidth: 2,
        propsForDots: { r: '0' },
        propsForBackgroundLines: { stroke: colors.border },
        decimalPlaces: 0,
      }}
      bezier
      withInnerLines
      withOuterLines={false}
      style={{ borderRadius: 12, marginLeft: -16 }}
    />
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<number[]>(FALLBACK_CHART);
  const [chartLabels, setChartLabels] = useState<string[]>(FALLBACK_LABELS);
  const [zones, setZones] = useState<ProblemZone[]>(FALLBACK_ZONES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [mRes, dRes, zRes] = await Promise.all([
        api.get('/dashboard/metrics'),
        api.get('/dashboard/dynamics'),
        api.get('/dashboard/problem-zones'),
      ]);

      const m = mRes.data;
      setMetrics({
        wellbeingIndex: {
          overall: Number(m?.wellbeingIndex?.overall ?? 74),
          status: (m?.wellbeingIndex?.status ?? 'risk') as StatusType,
        },
        burnoutRisk: {
          value: Number(m?.burnoutRisk?.value ?? 31),
          status: (m?.burnoutRisk?.status ?? 'low') as StatusType,
        },
        tensionConflicts: {
          value: Number(m?.tensionConflicts?.value ?? 18),
          status: (m?.tensionConflicts?.status ?? 'risk') as StatusType,
        },
        surveyCoverage: {
          value: Number(m?.surveyCoverage?.value ?? 62),
          period: m?.surveyCoverage?.period ?? '14 дней',
        },
      });

      const dArr = Array.isArray(dRes.data) ? dRes.data : [];
      if (dArr.length) {
        setChartData(dArr.map((d: any) => Number(d.value)));
        setChartLabels(dArr.map((d: any) => String(d.week ?? '').slice(0, 3)));
      }

      const zArr = Array.isArray(zRes.data) ? zRes.data : [];
      if (zArr.length) setZones(zArr);
    } catch {
      setMetrics(FALLBACK_METRICS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.purple} />
      </View>
    );
  }

  const m = metrics!;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.purple} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>Дашборд</Text>
            <Text style={styles.pageSub}>Мониторинг состояния коллектива</Text>
          </View>
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? 'U'}</Text>
          </View>
        </View>

        {/* 2×2 metric cards */}
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Индекс благополучия"
            value={String(m.wellbeingIndex.overall)}
            status={m.wellbeingIndex.status}
            desc="Последние 14 дней"
          />
          <MetricCard
            title="Риск выгорания"
            value={`${m.burnoutRisk.value}%`}
            status={m.burnoutRisk.status}
            desc="Сигналы усталости"
          />
          <MetricCard
            title="Напряжение"
            value={`${m.tensionConflicts.value}%`}
            status={m.tensionConflicts.status}
            desc="Климат в командах"
          />
          <MetricCard
            title="Охват опроса"
            value={`${m.surveyCoverage.value}%`}
            status="ok"
            desc={m.surveyCoverage.period}
          />
        </View>

        {/* Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Динамика благополучия</Text>
          <Text style={styles.sectionSub}>Тренд по неделям</Text>
          <View style={styles.chartCard}>
            <NativeChart data={chartData} labels={chartLabels} />
          </View>
        </View>

        {/* Problem zones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Проблемные зоны</Text>
          <Text style={styles.sectionSub}>Топ-3 зоны по суммарному риску</Text>
          {zones.map((z, i) => {
            const color = statusColor(z.status);
            return (
              <View key={z.id ?? i} style={styles.zoneCard}>
                <View style={styles.zoneHeader}>
                  <Text style={styles.zoneDept}>{z.department}</Text>
                  <View style={[styles.zoneBadge, { backgroundColor: color + '20' }]}>
                    <Text style={[styles.zoneBadgeText, { color }]}>{statusLabel(z.status)}</Text>
                  </View>
                </View>
                <Text style={styles.zoneFactor}>{z.factor}</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${z.score}%` as any, backgroundColor: color },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({
  title, value, status, desc,
}: {
  title: string; value: string; status: string; desc: string;
}) {
  const color = statusColor(status);
  return (
    <View style={metricSt.card}>
      <View style={metricSt.top}>
        <Text style={metricSt.title} numberOfLines={2}>{title}</Text>
        <View style={[metricSt.badge, { backgroundColor: color + '20' }]}>
          <Text style={[metricSt.badgeText, { color }]}>{statusLabel(status)}</Text>
        </View>
      </View>
      <Text style={metricSt.value}>{value}</Text>
      <Text style={metricSt.desc}>{desc}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const CARD_W = (SCREEN_W - 52) / 2;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPrimary },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
  },
  pageTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  pageSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  avatarBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.purple,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  sectionSub: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
  chartCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  zoneCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  zoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  zoneDept: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  zoneFactor: { fontSize: 13, color: colors.textSecondary, marginBottom: 10 },
  zoneBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  zoneBadgeText: { fontSize: 11, fontWeight: '600' },
  progressBar: { height: 6, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
});

const metricSt = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 14,
    width: CARD_W,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  title: { fontSize: 12, color: colors.textSecondary, fontWeight: '500', flex: 1, marginRight: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  value: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  desc: { fontSize: 11, color: colors.textMuted },
});

const chartFallback = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: 8,
  },
  col: { flex: 1, alignItems: 'center', marginHorizontal: 2 },
  barWrap: { flex: 1, width: '70%', justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: colors.purple, borderRadius: 4, opacity: 0.85 },
  label: { fontSize: 9, color: colors.textMuted, marginTop: 4 },
});
