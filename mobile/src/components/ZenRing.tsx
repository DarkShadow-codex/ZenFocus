// ============================================================================
// ZEN RING WIDGET (Derived from DESIGN.md)
// Signature circular focus gauge with gradient stroke, tabular figures, & breathing pulse
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Palette, Radii } from '../theme';

interface ZenRingProps {
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  streakDays: number;
  themeMode: 'light' | 'dark';
}

export const ZenRing: React.FC<ZenRingProps> = ({
  totalSeconds,
  remainingSeconds,
  isRunning,
  streakDays,
  themeMode,
}) => {
  const theme = Palette[themeMode];
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Breathing pulse animation when timer is actively running
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isRunning) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.96,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [isRunning]);

  const size = 280;
  const strokeWidth = 12;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  const progressFraction = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const strokeDashoffset = circumference * (1 - progressFraction);

  // Time format MM:SS
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const phaseLabel = isRunning
    ? 'Deep Flow Active'
    : remainingSeconds === 0
    ? 'Session Complete!'
    : remainingSeconds < totalSeconds
    ? 'Session Paused'
    : 'Ready to Focus';

  return (
    <View style={styles.container}>
      {/* Ambient Breathing Halo Glow */}
      <Animated.View
        style={[
          styles.glowHalo,
          {
            backgroundColor: isRunning ? Palette.mintGlow : 'transparent',
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="zenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Palette.primary} />
            <Stop offset="50%" stopColor={Palette.secondary} />
            <Stop offset="100%" stopColor={Palette.tertiary} />
          </LinearGradient>
        </Defs>

        {/* Static Background Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.surfaceBorder}
          strokeWidth={strokeWidth - 2}
          fill="none"
        />

        {/* Dynamic Gradient Progress Stroke */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#zenGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      {/* Center Readout Content */}
      <View style={styles.readout}>
        <Text style={[styles.timerText, { color: theme.textPrimary }]}>{formattedTime}</Text>
        <Text
          style={[
            styles.phaseText,
            { color: isRunning ? Palette.tertiary : Palette.primary },
          ]}
        >
          {phaseLabel}
        </Text>
        <Text style={[styles.streakText, { color: theme.textSecondary }]}>
          Daily Streak: <Text style={{ color: Palette.warning, fontWeight: '700' }}>{streakDays} Days 🔥</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 290,
    height: 290,
    marginVertical: 16,
    position: 'relative',
  },
  glowHalo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: Radii.full,
    opacity: 0.8,
  },
  svg: {
    position: 'absolute',
  },
  readout: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 52,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1.5,
  },
  phaseText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
});
