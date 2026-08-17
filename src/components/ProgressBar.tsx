import React from 'react';
import { View, Text } from 'react-native';
import { typography } from '../theme';

type Tone = 'primary' | 'success' | 'warning';
type Thickness = 'thin' | 'normal';

const TONE_BG: Record<Tone, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
};

const THICKNESS_TRACK: Record<Thickness, string> = {
  thin: 'h-1.5',
  normal: 'h-2',
};

interface ProgressBarProps {
  /** 0–100. Values outside the range are clamped. */
  value: number;
  label?: string;
  trailingLabel?: string;
  tone?: Tone;
  thickness?: Thickness;
  /** Optional small row beneath the bar (e.g. "Đã hoàn thành mục tiêu ngày!"). */
  footer?: React.ReactNode;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  trailingLabel,
  tone = 'primary',
  thickness = 'normal',
  footer,
  className = '',
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  const widthPercent = `${clamped}%`;

  return (
    <View className={className}>
      {(label || trailingLabel) ? (
        <View className="flex-row justify-between items-center mb-2">
          {label ? (
            <Text className={typography.eyebrow}>{label}</Text>
          ) : (
            <View />
          )}
          {trailingLabel ? (
            <Text className={typography.bodySm + ' font-bold'}>{trailingLabel}</Text>
          ) : null}
        </View>
      ) : null}

      <View className={`w-full bg-muted rounded-full overflow-hidden ${THICKNESS_TRACK[thickness]}`}>
        <View
          className={`h-full ${TONE_BG[tone]} rounded-full`}
          style={{ width: widthPercent as `${number}%` }}
        />
      </View>

      {footer ? <View className="mt-2">{footer}</View> : null}
    </View>
  );
};
