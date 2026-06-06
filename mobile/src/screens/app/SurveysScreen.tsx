import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../api/client';
import { colors } from '../../theme/colors';

interface Survey {
  id: string;
  name: string;
  departments: string[];
  status: 'active' | 'draft' | 'closed';
  anonymityThreshold: number;
  createdAt: string;
  archived?: boolean;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'active', color: colors.green, bg: colors.green + '20' },
  draft: { label: 'draft', color: colors.yellow, bg: colors.yellow + '20' },
  closed: { label: 'closed', color: colors.textMuted, bg: colors.bgMuted },
};

export default function SurveysScreen() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'active' | 'archived'>('active');

  const load = async () => {
    try {
      const res = await api.get('/surveys');
      const data = res.data;
      const list = Array.isArray(data) ? data
        : Array.isArray(data?.surveys) ? data.surveys
        : Array.isArray(data?.items) ? data.items
        : [];
      setSurveys(list);
    } catch {
      setSurveys([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  const active = surveys.filter(s => !s.archived);
  const archived = surveys.filter(s => !!s.archived);
  const shown = tab === 'active' ? active : archived;

  const onArchive = async (id: string) => {
    try {
      await api.patch(`/surveys/${id}/archive`);
      load();
    } catch {
      Alert.alert('Ошибка', 'Не удалось архивировать опрос');
    }
  };

  const onUnarchive = async (id: string) => {
    try {
      await api.patch(`/surveys/${id}/unarchive`);
      load();
    } catch {
      Alert.alert('Ошибка', 'Не удалось восстановить опрос');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Опросы</Text>
        <Text style={styles.pageSub}>Управление опросами по отделам</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'active' && styles.tabActive]}
          onPress={() => setTab('active')}
        >
          <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>
            Активные <Text style={styles.tabCount}>{active.length}</Text>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'archived' && styles.tabActive]}
          onPress={() => setTab('archived')}
        >
          <Text style={[styles.tabText, tab === 'archived' && styles.tabTextActive]}>
            Архив <Text style={styles.tabCount}>{archived.length}</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.purple} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.purple} />}
          showsVerticalScrollIndicator={false}
        >
          {shown.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {tab === 'active' ? 'Нет активных опросов' : 'Архив пуст'}
              </Text>
            </View>
          ) : (
            shown.map((s) => {
              const st = statusConfig[s.status] ?? statusConfig.draft;
              const deptStr = s.departments?.slice(0, 2).join(', ') + (s.departments?.length > 2 ? ` +${s.departments.length - 2}` : '');
              return (
                <View key={s.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardName} numberOfLines={2}>{s.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                      <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>

                  {deptStr ? (
                    <Text style={styles.deptText}>{deptStr}</Text>
                  ) : null}

                  <View style={styles.cardMeta}>
                    <Text style={styles.metaText}>Порог: {s.anonymityThreshold ?? '—'}</Text>
                    <Text style={styles.metaText}>
                      {new Date(s.createdAt).toLocaleDateString('ru-RU')}
                    </Text>
                  </View>

                  <View style={styles.cardActions}>
                    {s.archived ? (
                      <TouchableOpacity style={styles.btnLight} onPress={() => onUnarchive(s.id)}>
                        <Text style={styles.btnLightText}>↩ Вернуть</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.btnLight} onPress={() => onArchive(s.id)}>
                        <Text style={styles.btnLightText}>📦 В архив</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
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
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  pageSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: colors.bgTertiary,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  tabActive: { backgroundColor: colors.bgSecondary, shadowColor: colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: colors.textPrimary, fontWeight: '600' },
  tabCount: { color: colors.purple, fontSize: 12 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: colors.textMuted, fontSize: 15 },
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  deptText: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  metaText: { fontSize: 12, color: colors.textMuted },
  cardActions: { flexDirection: 'row', gap: 8 },
  btnLight: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.bgTertiary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnLightText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
});
