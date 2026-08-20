import { useState } from 'react';
import { View } from 'react-native';
import {
  AudioLinesIcon,
  MicVocalIcon,
  QueueIcon,
  ScText,
  VolumeIcon,
} from '@sc/ui';
import { useT } from '../../i18n';
import { useEq } from '../../player/EqContext';
import { lyricsUi, useLyricsUi } from '../../player/lyrics-ui';
import { VOLUME_MAX } from '../../player/PlayerContext';
import { usePanels } from '../panels';
import { IconButton } from './IconButton';
import { Slider } from './Slider';
import { TuningBtn } from './TuningBtn';

/** Правый кластер плеера: настройка звука, EQ, лирика, очередь, громкость. */
export function Extras({
  volume,
  onSetVolume,
  onToggleMute,
  accentColor,
  glowColor,
}: {
  volume: number;
  onSetVolume: (v: number) => void;
  onToggleMute: () => void;
  accentColor: string;
  glowColor: string;
}) {
  const idle = 'rgba(255,255,255,0.55)';

  const panels = usePanels();
  const eq = useEq();
  const lyrics = useLyricsUi();

  const [tuningOpen, setTuningOpen] = useState(false);

  const boosted = volume > 100;
  const t = useT();

  const openEqualizer = () => {
    /*
     * Important for iPhone:
     *
     * TuningBtn is a local popover, while Equalizer is a global panel.
     * Close the local popover first so it cannot remain visible above/below
     * the EQ overlay.
     */
    setTuningOpen(false);

    /*
     * panels.toggle() also guarantees that only one global panel
     * (queue / eq) can be open at a time.
     */
    panels.toggle('eq');
  };

  const toggleQueue = () => {
    /*
     * If the Tuning popover is open, close it before opening Queue.
     * This keeps the mobile player clean as well.
     */
    setTuningOpen(false);
    panels.toggle('queue');
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        minWidth: 0,
      }}
    >
      <TuningBtn
        open={tuningOpen}
        onOpenChange={setTuningOpen}
      />

      <IconButton
        size={30}
        onPress={openEqualizer}
        tooltip={t('player.eq')}
      >
        <AudioLinesIcon
          size={16}
          color={eq.enabled ? accentColor : idle}
        />
      </IconButton>

      <IconButton
        size={30}
        onPress={() => lyricsUi.toggle()}
        tooltip={t('player.lyrics')}
      >
        <MicVocalIcon
          size={16}
          color={lyrics.open ? accentColor : idle}
        />
      </IconButton>

      <IconButton
        size={30}
        onPress={toggleQueue}
        tooltip={t('player.queue')}
      >
        <QueueIcon
          size={16}
          color={
            panels.isOpen('queue')
              ? accentColor
              : idle
          }
        />
      </IconButton>

      <IconButton
        size={36}
        onPress={onToggleMute}
        tooltip={t('player.mute')}
      >
        <VolumeIcon
          size={16}
          color={
            volume === 0
              ? accentColor
              : idle
          }
          muted={volume === 0}
          low={volume < 50}
        />
      </IconButton>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingLeft: 4,
          flexShrink: 1,
        }}
      >
        <Slider
          value={volume / VOLUME_MAX}
          onSeek={(f) =>
            onSetVolume(f * VOLUME_MAX)
          }
          color={
            volume === 0
              ? idle
              : boosted
                ? '#fbbf24'
                : 'rgba(255,255,255,0.6)'
          }
          glowColor={glowColor}
          height={3}
          hoverHeight={4}
          thumbSize={10}
          tickFrac={0.5}
          style={{
            width: 72,
          }}
        />

        <ScText
          style={{
            fontSize: 10,
            width: 30,
            textAlign: 'right',
            color: boosted
              ? 'rgba(251,191,36,0.7)'
              : 'rgba(255,255,255,0.3)',
          }}
        >
          {volume}%
        </ScText>
      </View>
    </View>
  );
}