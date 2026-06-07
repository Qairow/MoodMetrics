import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../api/client';
import { colors } from '../../theme/colors';

interface GeneratedQuestion {
  id: number;
  text: string;
  type: 'scale' | 'yesno' | 'text';
  required: boolean;
}

interface GeneratedSurvey {
  name: string;
  description: string;
  category: string;
  duration_minutes: number;
  questions: GeneratedQuestion[];
}

const TYPE_CFG = {
  scale: { icon: '⭐', label: 'Шкала 1–5', color: colors.purple },
  yesno: { icon: '👍', label: 'Да / Нет',   color: colors.green },
  text:  { icon: '📝', label: 'Открытый',   color: colors.yellow },
} as const;

const EXAMPLE_PROMPTS = [
  'Выгорание в команде разработки',
  'Еженедельный пульс-опрос',
  'Командный климат после изменений',
  'Удовлетворённость онбордингом',
];

export default function GeneratorScreen() {
  const [prompt, setPrompt]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [generated, setGenerated] = useState<GeneratedSurvey | null>(null);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    api.get('/surveys/generations')
      .then(r => setRemaining(r.data.remaining ?? null))
      .catch(() => {});
  }, []);

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setGenerated(null);
    setSaved(false);

    try {
      const res = await api.post('/surveys/generate', { prompt: prompt.trim() });
      setGenerated(res.data.survey);
      setRemaining(res.data.remaining);
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? 'Ошибка генерации';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!generated || saving) return;
    setSaving(true);
    try {
      await api.post('/surveys/templates', {
        name: generated.name,
        questions: generated.questions.map(q => ({ text: q.text, type: q.type })),
      });
      setSaved(true);
      Alert.alert('Сохранено', `Шаблон «${generated.name}» добавлен в библиотеку.`);
    } catch {
      Alert.alert('Ошибка', 'Не удалось сохранить шаблон');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.hero}>
            <Text style={styles.heroIcon}>✨</Text>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>AI Генератор опросов</Text>
              <Text style={styles.heroSub}>
                Опишите нужный опрос — ИИ создаст 10 вопросов
              </Text>
            </View>
            {remaining !== null && (
              <View style={styles.quota}>
                <Text style={styles.quotaNum}>{remaining}</Text>
                <Text style={styles.quotaLabel}>осталось</Text>
              </View>
            )}
          </View>

          {/* Prompt card */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Опишите нужный опрос</Text>
            <TextInput
              style={styles.input}
              placeholder="Например: опрос для оценки выгорания в команде продаж"
              placeholderTextColor={colors.textMuted}
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={3}
              editable={!loading}
              textAlignVertical="top"
            />

            {/* Example chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {EXAMPLE_PROMPTS.map(p => (
                <TouchableOpacity key={p} style={styles.chip} onPress={() => setPrompt(p)}>
                  <Text style={styles.chipText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.btnPrimary, (loading || !prompt.trim()) && styles.btnDisabled]}
              onPress={generate}
              disabled={loading || !prompt.trim()}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnPrimaryText}>✨ Сгенерировать</Text>
              )}
            </TouchableOpacity>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          {/* Loading skeleton */}
          {loading && (
            <View style={styles.card}>
              <SkeletonLine width="55%" height={18} mb={10} />
              <SkeletonLine width="80%" height={13} mb={20} />
              {Array.from({ length: 4 }).map((_, i) => (
                <View key={i} style={styles.skRow}>
                  <SkeletonBox size={28} />
                  <SkeletonLine width="75%" height={13} />
                </View>
              ))}
            </View>
          )}

          {/* Result */}
          {!loading && generated && (
            <View style={styles.card}>
              {/* Result header */}
              <Text style={styles.resultName}>{generated.name}</Text>
              {!!generated.description && (
                <Text style={styles.resultDesc}>{generated.description}</Text>
              )}

              <View style={styles.tagsRow}>
                {!!generated.category && (
                  <View style={styles.tagCat}>
                    <Text style={styles.tagCatText}>{generated.category}</Text>
                  </View>
                )}
                <View style={styles.tag}>
                  <Text style={styles.tagText}>⏱ {generated.duration_minutes ?? 5} мин</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>📋 {generated.questions.length} вопросов</Text>
                </View>
              </View>

              {/* Save button */}
              {saved ? (
                <View style={styles.savedBadge}>
                  <Text style={styles.savedText}>✓ Шаблон сохранён</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.btnSave, saving && styles.btnDisabled]}
                  onPress={save}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  {saving ? (
                    <ActivityIndicator color={colors.purple} size="small" />
                  ) : (
                    <Text style={styles.btnSaveText}>💾 Сохранить как шаблон</Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Questions */}
              <View style={styles.divider} />
              {generated.questions.map((q, i) => {
                const cfg = TYPE_CFG[q.type] ?? TYPE_CFG.scale;
                return (
                  <View key={q.id ?? i} style={styles.qRow}>
                    <View style={styles.qNum}>
                      <Text style={styles.qNumText}>{i + 1}</Text>
                    </View>
                    <View style={styles.qBody}>
                      <Text style={styles.qText}>{q.text}</Text>
                      <Text style={[styles.qType, { color: cfg.color }]}>
                        {cfg.icon} {cfg.label}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Skeleton helpers ──────────────────────────────────────────────────────────

function SkeletonLine({ width, height, mb }: { width: string; height: number; mb?: number }) {
  return (
    <View
      style={[
        skSt.base,
        { width: width as any, height, borderRadius: height / 2, marginBottom: mb ?? 8 },
      ]}
    />
  );
}

function SkeletonBox({ size }: { size: number }) {
  return (
    <View style={[skSt.base, { width: size, height: size, borderRadius: 8, marginRight: 10, flexShrink: 0 }]} />
  );
}

const skSt = StyleSheet.create({
  base: { backgroundColor: '#ebebf0' },
});

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: colors.bgPrimary },
  flex:  { flex: 1 },
  content: { paddingBottom: 36 },

  /* Hero */
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.purple,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  heroIcon:  { fontSize: 30, lineHeight: 36 },
  heroText:  { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 3 },
  heroSub:   { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  quota: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quotaNum:   { fontSize: 22, fontWeight: '900', color: '#fff' },
  quotaLabel: { fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },

  /* Card */
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  /* Input */
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 80,
    backgroundColor: '#fafbff',
  },

  /* Chips */
  chipsScroll: { marginVertical: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.purple + '50',
    backgroundColor: colors.purple + '10',
    marginRight: 8,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.purple },

  /* Buttons */
  btnPrimary: {
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  btnDisabled: { opacity: 0.45 },

  btnSave: {
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.purple + '50',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 4,
  },
  btnSaveText: { color: colors.purple, fontSize: 14, fontWeight: '800' },

  savedBadge: {
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.green + '15',
    borderWidth: 1,
    borderColor: colors.green + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 4,
  },
  savedText: { color: colors.green, fontSize: 13, fontWeight: '800' },

  /* Error */
  errorBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: colors.red + '10',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.red + '30',
  },
  errorText: { color: colors.red, fontSize: 13, fontWeight: '500' },

  /* Result header */
  resultName: { fontSize: 18, fontWeight: '900', color: colors.textPrimary, marginBottom: 6 },
  resultDesc: { fontSize: 13, color: colors.textSecondary, marginBottom: 10, lineHeight: 19 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 2 },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 16,
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  tagCat: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 16,
    backgroundColor: colors.purple + '15',
    borderWidth: 1,
    borderColor: colors.purple + '30',
  },
  tagCatText: { fontSize: 11, fontWeight: '700', color: colors.purple },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },

  /* Questions */
  qRow: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'flex-start' },
  qNum: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: colors.purple + '18',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  qNumText: { fontSize: 11, fontWeight: '800', color: colors.purple },
  qBody: { flex: 1 },
  qText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, lineHeight: 19, marginBottom: 4 },
  qType: { fontSize: 11, fontWeight: '700' },

  /* Skeleton */
  skRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
});
