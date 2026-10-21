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
  Platform,
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
import { CustomStudyTimerModal } from '../components/CustomStudyTimerModal';
import { AppScannerModal } from '../components/AppScannerModal';
import { RestrictionPolicy } from '../types';

export const ChildDashboardScreen: React.FC = () => {
  const {
    themeMode,
    timer,
    setTimerPreset,
    setCustomTimer,
    adjustTimer,
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
    account,
    selectedChildDevice,
  } = useZenFocus();

  const theme = Palette[themeMode];
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAppForModal, setSelectedAppForModal] = useState<{ appName: string; targetPackage: string } | undefined>();
  const [shieldModalVisible, setShieldModalVisible] = useState(false);
  const [selectedPolicyForShield, setSelectedPolicyForShield] = useState<RestrictionPolicy | null>(null);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [adjustToast, setAdjustToast] = useState<string | null>(null);
  const [timerTab, setTimerTab] = useState<'multiHour' | 'quick'>('multiHour');

  const quickPresets = [
    { label: '15m Quick', mins: 15 },
    { label: '25m Pomodoro', mins: 25 },
    { label: '45m Deep Work', mins: 45 },
    { label: '60m (1h) Mastery', mins: 60 },
  ];

  const multiHourPresets = [
    { label: '75m (1h 15m)', mins: 75 },
    { label: '90m (1.5h)', mins: 90 },
    { label: '120m (2h)', mins: 120 },
    { label: '180m (3h)', mins: 180 },
  ];

  const handleAdjust = (deltaMins: number) => {
    adjustTimer(deltaMins);
    const sign = deltaMins > 0 ? `+${deltaMins}m` : `${deltaMins}m`;
    const toastMsg = `${sign} adjusted! (${Math.round(timer.totalSeconds / 60) + (timer.isRunning ? 0 : deltaMins)}m goal)`;
    setAdjustToast(toastMsg);
    setTimeout(() => setAdjustToast(null), 2500);
  };


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

      {/* Device & Capability Verification Card (Strictly locked to physical/child platform) */}
      <DeviceStatusCard
        capabilities={capabilities}
        themeMode={themeMode}
        activePlatform={account?.role === 'CHILD' ? (Platform.OS === 'ios' ? 'ios' : 'android') : selectedChildDevice.platform}
        deviceName={`${account?.role === 'CHILD' ? account.name : selectedChildDevice.childName}'s ${selectedChildDevice.deviceName}`}
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

        {/* Real-time Adjustment Toast */}
        {adjustToast && (
          <View style={[styles.toastBanner, { backgroundColor: Palette.primaryContainer, borderColor: Palette.primary }]}>
            <Ionicons name="sparkles" size={16} color={Palette.primary} />
            <Text style={[styles.toastBannerText, { color: Palette.primary }]}>{adjustToast}</Text>
          </View>
        )}

        {/* The Signature Zen Ring */}
        <ZenRing
          totalSeconds={timer.totalSeconds}
          remainingSeconds={timer.remainingSeconds}
          isRunning={timer.isRunning}
          streakDays={timer.streakDays}
          themeMode={themeMode}
        />

        {/* Active Session Intent Banner (when running or custom goal set) */}
        {timer.sessionName && (
          <View style={[styles.activeSessionBanner, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorderSubtle }]}>
            <Ionicons name="bookmark-outline" size={14} color={Palette.primary} />
            <Text style={[styles.activeSessionText, { color: theme.textPrimary }]}>
              Focus Goal: <Text style={{ fontWeight: '700', color: Palette.primary }}>{timer.sessionName}</Text>
            </Text>
          </View>
        )}

        {/* Preset Category Switcher Tabs */}
        <View style={styles.presetTabsRow}>
          <TouchableOpacity
            style={[
              styles.presetTabBtn,
              { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder },
              timerTab === 'multiHour' && { backgroundColor: Palette.primary, borderColor: Palette.primary },
            ]}
            onPress={() => setTimerTab('multiHour')}
          >
            <Text
              style={[
                styles.presetTabText,
                { color: theme.textSecondary },
                timerTab === 'multiHour' && { color: '#ffffff', fontWeight: '700' },
              ]}
            >
              🔥 Deep Study (&gt;1h)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.presetTabBtn,
              { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder },
              timerTab === 'quick' && { backgroundColor: Palette.primary, borderColor: Palette.primary },
            ]}
            onPress={() => setTimerTab('quick')}
          >
            <Text
              style={[
                styles.presetTabText,
                { color: theme.textSecondary },
                timerTab === 'quick' && { color: '#ffffff', fontWeight: '700' },
              ]}
            >
              ⚡ Quick (15-60m)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.presetTabBtn,
              { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorder },
            ]}
            onPress={() => setCustomModalVisible(true)}
          >
            <Ionicons name="options-outline" size={13} color={Palette.primary} />
            <Text style={[styles.presetTabText, { color: Palette.primary, fontWeight: '700' }]}>
              Self-Set...
            </Text>
          </TouchableOpacity>
        </View>

        {/* Presets Grid */}
        <View style={styles.presetsRow}>
          {(timerTab === 'multiHour' ? multiHourPresets : quickPresets).map((p) => {
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

        {/* Self-Set / Quick Adjust Study Time Bar */}
        <View style={[styles.adjustBar, { backgroundColor: theme.surfaceSecondary, borderColor: theme.surfaceBorderSubtle }]}>
          <View style={styles.adjustHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="timer-outline" size={15} color={Palette.primary} />
              <Text style={[styles.adjustTitle, { color: theme.textPrimary }]}>
                Self-Adjust Timer (Android & iOS)
              </Text>
            </View>
            <Text style={[styles.adjustSubtitle, { color: theme.textMuted }]}>Tap to fine-tune</Text>
          </View>

          <View style={styles.adjustBtnsRow}>
            <TouchableOpacity
              style={[styles.adjustBtn, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
              onPress={() => handleAdjust(-15)}
            >
              <Text style={[styles.adjustBtnText, { color: theme.textPrimary }]}>-15m</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.adjustBtn, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
              onPress={() => handleAdjust(15)}
            >
              <Text style={[styles.adjustBtnText, { color: theme.textPrimary }]}>+15m</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.adjustBtn, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
              onPress={() => handleAdjust(30)}
            >
              <Text style={[styles.adjustBtnText, { color: Palette.primary, fontWeight: '700' }]}>+30m</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.adjustBtn, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
              onPress={() => handleAdjust(60)}
            >
              <Text style={[styles.adjustBtnText, { color: Palette.secondary, fontWeight: '700' }]}>+1 Hour</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.adjustBtn, { backgroundColor: Palette.primary, borderColor: Palette.primary }]}
              onPress={() => setCustomModalVisible(true)}
            >
              <Text style={[styles.adjustBtnText, { color: '#ffffff', fontWeight: '700' }]}>Custom...</Text>
            </TouchableOpacity>
          </View>
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Active Enforced Restrictions</Text>
          <TouchableOpacity
            style={[
              styles.chip,
              {
                backgroundColor: 'rgba(81, 70, 229, 0.1)',
                borderColor: Palette.primary,
                paddingHorizontal: 10,
                paddingVertical: 4,
                flexDirection: 'row',
                alignItems: 'center',
              },
            ]}
            onPress={() => setScannerVisible(true)}
            testID="child-view-scanned-apps-btn"
          >
            <Ionicons name="scan-outline" size={13} color={Palette.primary} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: Palette.primary, marginLeft: 4 }}>
              Scanned Apps
            </Text>
          </TouchableOpacity>
        </View>
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
              {totalFocusMinutesToday >= 60
                ? `${Math.floor(totalFocusMinutesToday / 60)}h ${totalFocusMinutesToday % 60}m Focused`
                : `${totalFocusMinutesToday}m Focused`}
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
                  +{sess.durationMinutes >= 60
                    ? `${Math.floor(sess.durationMinutes / 60)}h ${sess.durationMinutes % 60 > 0 ? (sess.durationMinutes % 60) + 'm' : ''}`
                    : `${sess.durationMinutes} min`}
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

      {/* Custom Multi-Hour Self-Set Study Timer Modal */}
      <CustomStudyTimerModal
        visible={customModalVisible}
        onClose={() => setCustomModalVisible(false)}
        onSetTimer={(mins, sessionName) => {
          setCustomTimer(mins, sessionName);
          const hours = Math.floor(mins / 60);
          const remMins = mins % 60;
          const label = hours > 0 ? `${hours}h ${remMins > 0 ? remMins + 'm' : ''}`.trim() : `${mins}m`;
          setAdjustToast(`Set ${label} study session: "${sessionName}"`);
          setTimeout(() => setAdjustToast(null), 3000);
        }}
        currentMinutes={Math.max(1, Math.round(timer.totalSeconds / 60))}
        themeMode={themeMode}
        activePlatform={activePlatform}
      />

      {/* App Scanner Modal for Child Device */}
      <AppScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        childDevice={selectedChildDevice}
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
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.full,
    borderWidth: 1,
    marginVertical: 6,
  },
  toastBannerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  activeSessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radii.full,
    borderWidth: 1,
    marginBottom: 8,
  },
  activeSessionText: {
    fontSize: 12,
  },
  presetTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  presetTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  presetTabText: {
    fontSize: 11,
    fontWeight: '600',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 4,
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
    marginBottom: 14,
  },
  adjustBar: {
    width: '100%',
    padding: 10,
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: 16,
  },
  adjustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  adjustTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  adjustSubtitle: {
    fontSize: 10,
  },
  adjustBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  adjustBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 2,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  adjustBtnText: {
    fontSize: 11,
    fontWeight: '600',
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
