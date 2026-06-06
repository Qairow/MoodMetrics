import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

const roleLabel: Record<string, string> = {
  admin: 'Администратор',
  hr: 'HR-менеджер',
  manager: 'Руководитель',
  employee: 'Сотрудник',
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [anonymity, setAnonymity] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Выйти', style: 'destructive', onPress: logout },
      ]
    );
  };

  const initial = user?.name?.[0]?.toUpperCase() ?? 'U';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Профиль</Text>

        {/* Avatar card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name ?? '—'}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? '—'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{roleLabel[user?.role ?? ''] ?? user?.role}</Text>
            </View>
          </View>
        </View>

        {/* Info section */}
        {(user?.department || user?.position) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Информация</Text>
            {user.department && (
              <InfoRow label="Отдел" value={user.department} />
            )}
            {user.position && (
              <InfoRow label="Должность" value={user.position} />
            )}
          </View>
        )}

        {/* Settings section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Настройки</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔔</Text>
              <View>
                <Text style={styles.settingLabel}>Уведомления</Text>
                <Text style={styles.settingDesc}>Push-уведомления о новых опросах</Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.border, true: colors.purple }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔒</Text>
              <View>
                <Text style={styles.settingLabel}>Анонимность</Text>
                <Text style={styles.settingDesc}>Порог: ≥ 7 ответов</Text>
              </View>
            </View>
            <Switch
              value={anonymity}
              onValueChange={setAnonymity}
              trackColor={{ false: colors.border, true: colors.purple }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        {/* Anonymity info card */}
        <View style={styles.anonCard}>
          <View style={styles.anonHeader}>
            <Text style={styles.anonTitle}>🔒 Анонимность</Text>
            <View style={styles.anonBadge}>
              <Text style={styles.anonBadgeText}>ON</Text>
            </View>
          </View>
          <Text style={styles.anonText}>порог: ≥ 7 ответов</Text>
          <Text style={styles.anonText}>
            Показываем только агрегаты — без персональных ответов.
          </Text>
        </View>

        {/* Logout button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Выйти из аккаунта</Text>
        </TouchableOpacity>

        <Text style={styles.version}>MoodMetrics v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, paddingTop: 16, paddingBottom: 20 },
  profileCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: { color: colors.white, fontSize: 26, fontWeight: '700' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  profileEmail: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.purpleSoft,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleBadgeText: { fontSize: 12, color: colors.purple, fontWeight: '600' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  settingIcon: { fontSize: 20, marginRight: 12 },
  settingLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  settingDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  anonCard: {
    backgroundColor: colors.purpleSoft,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  anonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  anonTitle: { fontSize: 14, fontWeight: '600', color: colors.purple },
  anonBadge: { backgroundColor: colors.purple, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  anonBadgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  anonText: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red + '12',
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.red + '30',
  },
  logoutIcon: { fontSize: 18, marginRight: 8 },
  logoutText: { fontSize: 15, fontWeight: '600', color: colors.red },
  version: { textAlign: 'center', color: colors.textMuted, fontSize: 12 },
});

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
  },
  label: { fontSize: 14, color: colors.textSecondary },
  value: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
});
