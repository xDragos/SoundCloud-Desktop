import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  AudioLinesIcon,
  CloseIcon,
  GlassSurface,
  modalGlass,
  PowerIcon,
  RotateCcwIcon,
  ScText,
} from '@sc/ui';
import { useEq } from '../player/EqContext';
import { EQ_BAND_COUNT, EQ_LABELS, EQ_PRESETS } from '../player/eq-presets';
import { BandSlider } from './equalizer/BandSlider';
import { PresetChip } from './equalizer/PresetChip';

const CARD_WIDTH = 520;
const SCALE_HEIGHT = 140;

function EqHeader({
  enabled,
  onToggle,
  onReset,
  onClose,
}: {
  enabled: boolean;
  onToggle: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            backgroundColor: 'rgba(255,255,255,0.06)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AudioLinesIcon size={18} color="rgba(255,255,255,0.6)" />
        </View>

        <View style={{ flexShrink: 1 }}>
          <ScText
            numberOfLines={1}
            style={{
              fontSize: 17,
              fontWeight: '700',
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            Эквалайзер
          </ScText>

          <ScText
            numberOfLines={1}
            style={{
              marginTop: 1,
              fontSize: 10,
              color: 'rgba(255,255,255,0.32)',
            }}
          >
            Настройка звука
          </ScText>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <Pressable
          onPress={onToggle}
          hitSlop={6}
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            borderWidth: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: enabled
              ? 'rgba(52,211,153,0.15)'
              : 'rgba(255,255,255,0.04)',
            borderColor: enabled
              ? 'rgba(52,211,153,0.2)'
              : 'rgba(255,255,255,0.06)',
          }}
        >
          <PowerIcon
            size={15}
            color={enabled ? 'rgb(52,211,153)' : 'rgba(255,255,255,0.25)'}
          />
        </Pressable>

        <Pressable
          onPress={onReset}
          hitSlop={6}
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
            backgroundColor: 'rgba(255,255,255,0.04)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RotateCcwIcon size={14} color="rgba(255,255,255,0.3)" />
        </Pressable>

        {/* X */}
        <Pressable
          onPress={onClose}
          hitSlop={6}
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            backgroundColor: 'rgba(255,255,255,0.055)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CloseIcon size={15} color="rgba(255,255,255,0.65)" />
        </Pressable>
      </View>
    </View>
  );
}

function EqBandsRow({
  enabled,
  gains,
  onDrag,
}: {
  enabled: boolean;
  gains: number[];
  onDrag: (index: number, gain: number) => void;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 18,
        paddingBottom: 18,
        opacity: enabled ? 1 : 0.3,
      }}
      pointerEvents={enabled ? 'auto' : 'none'}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <View
          style={{
            height: SCALE_HEIGHT,
            justifyContent: 'space-between',
            marginRight: 7,
            marginTop: -22,
          }}
        >
          <ScText style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
            +12
          </ScText>

          <ScText style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
            0
          </ScText>

          <ScText style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
            -12
          </ScText>
        </View>

        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'space-between',
            minWidth: 0,
          }}
        >
          {Array.from({ length: EQ_BAND_COUNT }, (_, i) => (
            <BandSlider
              key={i}
              gain={gains[i] ?? 0}
              label={EQ_LABELS[i]}
              onDrag={(gain) => onDrag(i, gain)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function EqPresets({
  enabled,
  preset,
  onPick,
}: {
  enabled: boolean;
  preset: string;
  onPick: (id: string) => void;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 18,
        paddingBottom: 18,
        opacity: enabled ? 1 : 0.3,
      }}
      pointerEvents={enabled ? 'auto' : 'none'}
    >
      <ScText
        style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.3)',
          fontWeight: '500',
          marginBottom: 9,
        }}
      >
        Пресеты
      </ScText>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        {Object.entries(EQ_PRESETS).map(([id, p]) => (
          <PresetChip
            key={id}
            label={p.labelRu}
            active={preset === id}
            onPress={() => onPick(id)}
          />
        ))}

        {preset === 'custom' && (
          <PresetChip
            label="Пользовательский"
            active
            onPress={() => {}}
          />
        )}
      </View>
    </View>
  );
}

export function EqualizerPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    enabled,
    gains,
    preset,
    setEnabled,
    setBand,
    applyPreset,
    reset,
  } = useEq();

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!open) return;

    anim.setValue(0);

    Animated.timing(anim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [open, anim]);

  if (!open) return null;

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const isMobile = Platform.OS !== 'web';

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          zIndex: 200,
          elevation: 200,
        },
      ]}
    >
      {/* Background */}
      <Pressable
        onPress={onClose}
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: 'rgba(0,0,0,0.62)',
          },
        ]}
      />

      <View
        pointerEvents="box-none"
        style={[
          StyleSheet.absoluteFill,
          {
            alignItems: 'center',
            justifyContent: isMobile ? 'flex-end' : 'center',
            paddingHorizontal: isMobile ? 0 : 16,
            paddingBottom: isMobile ? 0 : 16,
            paddingTop: isMobile ? 0 : 16,
          },
        ]}
      >
        <Animated.View
          style={{
            width: isMobile ? '100%' : CARD_WIDTH,
            maxWidth: isMobile ? '100%' : '92%',
            maxHeight: isMobile ? '92%' : undefined,
            opacity: anim,
            transform: [{ translateY }],
          }}
        >
          <GlassSurface
            recipe={modalGlass}
            style={{
              borderTopLeftRadius: isMobile ? 24 : undefined,
              borderTopRightRadius: isMobile ? 24 : undefined,
              borderBottomLeftRadius: isMobile ? 0 : undefined,
              borderBottomRightRadius: isMobile ? 0 : undefined,
              overflow: 'hidden',
            }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={{
                paddingBottom: isMobile ? 10 : 0,
              }}
            >
              <EqHeader
                enabled={enabled}
                onToggle={() => setEnabled(!enabled)}
                onReset={reset}
                onClose={onClose}
              />

              <EqBandsRow
                enabled={enabled}
                gains={gains}
                onDrag={setBand}
              />

              <EqPresets
                enabled={enabled}
                preset={preset}
                onPick={applyPreset}
              />
            </ScrollView>
          </GlassSurface>
        </Animated.View>
      </View>
    </View>
  );
}