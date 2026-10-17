// ============================================================================
// CHILD DASHBOARD SCREEN (Student Focus Hub)
// Derived from PRD.md Section 7.5, app_flow.md Section 5 & 6
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useZenFocus } from '../store/ZenFocusContext';
import { Palette, Radii } from '../theme';
import { ZenRing } from '../components/ZenRing';
import { PolicyCard } from '../components/PolicyCard';
import { DeviceStatusCard } from '../components/DeviceStatusCard';
import { ExceptionRequestModal } from '../components/ExceptionRequestModal';
import { AppShieldModal } from '../components/AppShieldModal';
import { CelebrationModal } from '../components/CelebrationModal';
import { RestrictionPolicy } from '../types';

export const ChildDashboardScreen: React.FC = () => {
  const {
    themeMode,
    timer,
    setTimerPreset,
    startTimer,
    pauseTimer,
    resetTimer,
    effectiveRestrictions,
    toggleChildSelfPolicy,
    submitExceptionRequest,
    capabilities,
    lastDecisionNotice,
    dismissDecisionNotice,
    studyHistory,
    temporaryUnlocks,
    isCelebrationOpen,
    setIsCelebrationOpen,
    lastCompletedMinutes,
    takeBreak,
    activePlatform,
    setActivePlatform,
  } = useZenFocus();

  const theme = Palette[themeMode];
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAppForModal, setSelectedAppForModal] = useState<{ appName: string; targetPackage: string } | undefined>();
  const [shieldModalVisible, setShieldModalVisible] = useState(false);
  const [selectedPolicyForShield, setSelectedPolicyForShield] = useState<RestrictionPolicy | null>(null);

  const presets = [
    { label: '15m Quick', mins: 15 },
    { label: '25m Pomodoro', mins: 25 },
    { label: '45m Deep Work', mins: 45 },
    { label: '60m Mastery', mins: 60 },
  ];

  const handleOpenModal = (app?: { appName: string; targetPackage: string }) => {
    setSelectedAppForModal(app);
    setModalVisible(true);
  };

  const handleSelfChipToggle = (targetPackage: string, appName: string, isCurrentlyActive: boolean) => {
    toggleChildSelfPolicy(targetPackage, appName, !isCurrentlyActive);
  };

  const handleCardPress = (policy: RestrictionPolicy) => {
    if (policy.ownerType === 'parent' && policy.desiredState === 'active') {
      setSelectedPolicyForShield(policy);
      setShieldModalVisible(true);
    }
  };

  const totalFocusMinutesToday = studyHistory.reduce((acc, curr) => acc + curr.durationMinutes, 0);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.canvas }]} contentContainerStyle={styles.content}>
      
      {/* Real-Time Parent Decision Banner (PRD FR-073) */}
      {lastDecisionNotice && (
        <View
          style={[
            styles.decisionBanner,
            {
              backgroundColor: lastDecisionNotice.approved ? Palette.successBg : Palette.errorBg,
              borderColor: lastDecisionNotice.approved ? Palette.success : Palette.error,
            },
          ]}
        >
          <Ionicons
            name={lastDecisionNotice.approved ? 'checkmark-circle' : 'close-circle'}
            size={20}
            color={lastDecisionNotice.approved ? Palette.success : Palette.error}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.decisionTitle,
                { color: lastDecisionNotice.approved ? Palette.success : Palette.error },
              ]}
            >
              {lastDecisionNotice.approved ? 'Permission Approved' : 'Permission Rejected'}
            </Text>
            <Text style={[styles.decisionDesc, { color: theme.textPrimary }]}>
              {lastDecisionNotice.approved
                ? `Parent granted +${lastDecisionNotice.durationMinutes}m for ${lastDecisionNotice.appName}.`
                : `Parent maintained the active restriction on ${lastDecisionNotice.appName}.`}
            </Text>
          </View>
          <TouchableOpacity onPress={dismissDecisionNotice}>
            <Ionicons name="close" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Temporary Grace Unlock Card */}
      {temporaryUnlocks.length > 0 && (
        <View style={[styles.graceCard, { backgroundColor: Palette.successBg, borderColor: Palette.success }]}>
          <View style={styles.graceHeader}>
            <Ionicons name="time" size={18} color={Palette.success} />
            <Text style={[styles.graceTitle, { color: Palette.success }]}>Active Grace Unlock</Text>
          </View>
          {temporaryUnlocks.map((u) => (
            <Text key={u.targetPackage} style={[styles.graceDesc, { color: theme.textPrimary }]}>
              🔓 <Text style={{ fontWeight: '700' }}>{u.appName}</Text> temporarily unblocked for study (+{u.durationMinutes}m granted).
            </Text>
          ))}
        </View>
      )}

      {/* Device & Capability Verification Card */}
      <DeviceStatusCard
        capabilities={capabilities}
        themeMode={themeMode}
        activePlatform={activePlatform}
        onSwitchPlatform={setActivePlatform}
      />

      {/* Main Zen Ring Card */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Study Session</Text>
          <View style={[styles.badgeFocus, { backgroundColor: timer.isRunning ? Palette.tertiaryContainer : theme.surfaceSecondary }]}>
            <Text style={[styles.badgeFocusText, { color: timer.isRunning ? Palette.onTertiary : theme.textSecondary }]}>
              {timer.isRunning ? '● Focusing' : 'Ready'}
            </Text>
          </View>
        </View>

        {/* The Signature Zen Ring */}
        <ZenRing
          totalSeconds={timer.totalSeconds}
          remainingSeconds={timer.remainingSeconds}
          isRunning={timer.isRunning}
          streakDays={timer.streakDays}
          themeMode={themeMode}
        />

        {/* Presets */}
        <View style={styles.presetsRow}>
          {presets.map((p) => {
            const isSelected = timer.totalSeconds === p.mins * 60;
            return (
              <TouchableOpacity
                key={p.mins}
                style={[
                  styles.presetBtn,
                  { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder },
                  isSelected && { backgroundColor: Palette.primary, borderColor: Palette.primary },
                ]}
                onPress={() => setTimerPreset(p.mins)}
              >
                <Text
                  style={[
                    styles.presetText,
                    { color: theme.textPrimary },
                    isSelected && { color: '#ffffff', fontWeight: '700' },
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.circleBtnSec, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder }]}
            onPress={resetTimer}
          >
            <Ionicons name="refresh" size={20} color={theme.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.circleBtnPrimary, { backgroundColor: Palette.primary }]}
            onPress={timer.isRunning ? pauseTimer : startTimer}
          >
            <Ionicons name={timer.isRunning ? 'pause' : 'play'} size={28} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.circleBtnSec, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder }]}
            onPress={() => handleOpenModal()}
          >
            <Ionicons name="help-buoy" size={20} color={Palette.primary} />
          </TouchableOpacity>
        </View>

        {/* Student Self-Imposed Distractions Bar */}
        <View style={[styles.selfBlockBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorderSubtle }]}>
          <View style={styles.selfBlockHeader}>
            <Text style={[styles.selfBlockTitle, { color: theme.textSecondary }]}>
              Self-Imposed Distraction Shields
            </Text>
            <Text style={[styles.unionNote, { color: Palette.primary }]}>Union Rule</Text>
          </View>

          <View style={styles.chipsRow}>
            {[
              { name: 'Discord', pkg: 'com.discord' },
              { name: 'Reddit', pkg: 'com.reddit.frontpage' },
              { name: 'Roblox', pkg: 'com.roblox.client' },
            ].map((app) => {
              const policy = effectiveRestrictions.find((p) => p.targetPackage === app.pkg);
              const isActive = policy?.desiredState === 'active';
              return (
                <TouchableOpacity
                  key={app.pkg}
                  style={[
                    styles.chip,
                    { borderColor: theme.surfaceBorder, backgroundColor: theme.surface },
                    isActive && { backgroundColor: Palette.primary, borderColor: Palette.primary },
                  ]}
                  onPress={() => handleSelfChipToggle(app.pkg, app.name, isActive)}
                >
                  <Text style={[styles.chipText, { color: theme.textPrimary }, isActive && { color: '#ffffff', fontWeight: '700' }]}>
                    {isActive ? '✓ ' : '+ '}
                    {app.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Active Restrictions List */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Active Enforced Restrictions</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          Tap any parent-locked app to preview native shield block screen
        </Text>
      </View>

      {effectiveRestrictions.map((policy) => (
        <PolicyCard
          key={policy.id}
          policy={policy}
          viewerRole="CHILD"
          themeMode={themeMode}
          onPress={() => handleCardPress(policy)}
          onToggle={(newState) => {
            if (policy.ownerType === 'child') {
              toggleChildSelfPolicy(policy.targetPackage, policy.appName, newState);
            } else {
              Alert.alert('Parent Locked', 'This restriction is owned by your parent and cannot be removed by student controls.');
            }
          }}
          onRequestException={() => handleOpenModal({ appName: policy.appName, targetPackage: policy.targetPackage })}
        />
      ))}

      {/* Recent Focus Activity & Streak Card */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder, marginTop: 10, alignItems: 'stretch' }]}>
        <View style={styles.historyHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="trophy-outline" size={20} color={Palette.warning} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Focus Achievements</Text>
          </View>
          <View style={[styles.badgeFocus, { backgroundColor: Palette.primaryContainer }]}>
            <Text style={[styles.badgeFocusText, { color: Palette.primary }]}>
              {totalFocusMinutesToday}m Focused
            </Text>
          </View>
        </View>

        <View style={styles.historyList}>
          {studyHistory.slice(0, 3).map((sess) => (
            <View key={sess.id} style={[styles.historyItem, { borderBottomColor: theme.surfaceBorderSubtle }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.historyName, { color: theme.textPrimary }]}>{sess.sessionType}</Text>
                <Text style={[styles.historyTime, { color: theme.textMuted }]}>
                  {new Date(sess.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={[styles.historyBadge, { backgroundColor: Palette.tertiaryContainer }]}>
                <Ionicons name="checkmark-circle" size={14} color={Palette.onTertiary} />
                <Text style={[styles.historyBadgeText, { color: Palette.onTertiary }]}>
                  +{sess.durationMinutes} min
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Exception Request Modal */}
      <ExceptionRequestModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={submitExceptionRequest}
        themeMode={themeMode}
        preselectedApp={selectedAppForModal}
      />

      {/* App Shield Modal (Simulated Native Block Screen) */}
      <AppShieldModal
        visible={shieldModalVisible}
        onClose={() => setShieldModalVisible(false)}
        policy={selectedPolicyForShield}
        onRequestException={() => {
          if (selectedPolicyForShield) {
            handleOpenModal({
              appName: selectedPolicyForShield.appName,
              targetPackage: selectedPolicyForShield.targetPackage,
            });
          }
        }}
        themeMode={themeMode}
      />

      {/* Session Complete Celebration Modal */}
      <CelebrationModal
        visible={isCelebrationOpen}
        onClose={() => setIsCelebrationOpen(false)}
        minutesCompleted={lastCompletedMinutes || 25}
        streakDays={timer.streakDays}
        onTakeBreak={() => takeBreak(5)}
        themeMode={themeMode}
      />

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 16,
    paddingBottom: 40,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radii.xl,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  cardHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  badgeFocus: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.full,
  },
  badgeFocusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  presetBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 18,
  },
  circleBtnPrimary: {
    width: 64,
    height: 64,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  circleBtnSec: {
    width: 48,
    height: 48,
    borderRadius: Radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfBlockBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: 12,
  },
  selfBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  selfBlockTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  unionNote: {
    fontSize: 10,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  decisionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  decisionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  decisionDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  graceCard: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  graceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  graceTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  graceDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  historyName: {
    fontSize: 13,
    fontWeight: '600',
  },
  historyTime: {
    fontSize: 11,
    marginTop: 2,
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.full,
  },
  historyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
