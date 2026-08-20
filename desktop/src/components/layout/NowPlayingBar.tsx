import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
import { artUrl, dockGlass, GlassSurface, useScTheme } from '@sc/ui';
import { usePlayerState } from '../player/PlayerContext';
import { getPositionSecs } from '../player/position';
import { DockLoadingRing } from './now-playing/DockLoadingRing';
import { Extras } from './now-playing/Extras';
import { PillTrack } from './now-playing/PillTrack';
import { ProgressLane } from './now-playing/ProgressLane';
import { ReactCluster } from './now-playing/ReactCluster';
import { Transport } from './now-playing/Transport';

const sep = (
  <View
    style={{
      width: 1,
      height: 30,
      backgroundColor: 'rgba(255,255,255,0.16)',
    }}
  />
);

/** WebView не throttle'ит rAF/таймеры при сворачивании — глушим looping-анимации сами. */
function useDocHidden(): boolean {
  const [hidden, setHidden] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.visibilityState === 'hidden';
  });

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const onChange = () =>
      setHidden(document.visibilityState === 'hidden');

    document.addEventListener('visibilitychange', onChange);

    return () =>
      document.removeEventListener('visibilitychange', onChange);
  }, []);

  return hidden;
}

/** Фоновое свечение из обложки (донор `BackgroundGlow`) — только web+beauty, дёшево
 *  через CSS blur; на нативе пропускаем (нет per-frame-дешёвого блюра). */
function BackgroundGlow({
  artworkUrl,
}: {
  artworkUrl: string | null;
}) {
  const { perf } = useScTheme();
  const src = artUrl(artworkUrl, 't200x200');

  if (Platform.OS !== 'web' || !perf.bloom || !src) return null;

  return (
    <View
      pointerEvents="none"
      // @ts-expect-error web-only CSS
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        opacity: 0.05,
        filter: 'blur(48px)',
        backgroundImage: `url(${src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: 28,
      }}
    />
  );
}

/** Плавающая пилюля плеера — адаптирована для desktop + iPhone. */
export function NowPlayingBar() {
  const { accent } = useScTheme();
  const player = usePlayerState();
  const { currentTrack, playing, shuffle, repeat, abLoop } = player;

  const hidden = useDocHidden();
  const playingNow = playing && !hidden;

  const isMobile = Platform.OS !== 'web';

  const [hovered, setHovered] = useState(false);

  const rise = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.timing(rise, {
      toValue: 1,
      duration: 700,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
    }).start();
  }, [rise]);

  useEffect(() => {
    Animated.timing(glow, {
      toValue: hovered ? 1 : 0.85,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [hovered, glow]);

  const durationSecs = currentTrack
    ? currentTrack.duration_ms / 1000
    : 0;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        alignItems: 'center',

        paddingHorizontal: isMobile ? 8 : 16,
        paddingTop: isMobile ? 7 : 11,
        paddingBottom: isMobile ? 8 : 15,
      }}
    >
      <Animated.View
        style={{
          opacity: rise,
          width: isMobile ? '100%' : undefined,
          maxWidth: '100%',
          transform: [
            {
              translateY: rise.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: -3,
            left: 0,
            right: 0,
            alignItems: 'center',
            opacity: glow,
          }}
        >
          <View
            style={{
              width: isMobile ? '75%' : '62%',
              maxWidth: 660,
              height: 70,
              borderRadius: 35,

              // @ts-expect-error web-only CSS
              boxShadow: `0 10px 46px 8px ${accent.glow}`,
            }}
          />
        </Animated.View>

        <View
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          style={{
            width: isMobile ? '100%' : undefined,
            maxWidth: isMobile ? '100%' : undefined,
            borderRadius: isMobile ? 22 : 28,

            // @ts-expect-error web-only CSS
            boxShadow: `0 30px 70px -22px rgba(0,0,0,0.78), 0 0 64px -18px ${accent.glow}`,
          }}
        >
          <BackgroundGlow
            artworkUrl={currentTrack?.artwork_url ?? null}
          />

          <GlassSurface
            recipe={dockGlass}
            style={{
              width: isMobile ? '100%' : undefined,
              paddingHorizontal: isMobile ? 10 : 18,
              paddingTop: isMobile ? 8 : 10,
              paddingBottom: isMobile ? 7 : 8,
              borderRadius: isMobile ? 22 : undefined,
              overflow: 'hidden',
            }}
          >
            <View style={{ gap: isMobile ? 5 : 7 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: isMobile ? 7 : 12,
                  minWidth: 0,
                }}
              >
                <PillTrack
                  track={currentTrack}
                  playing={playingNow}
                />

                {!isMobile && (
                  <>
                    <ReactCluster track={currentTrack} />

                    {sep}
                  </>
                )}

                <Transport
                  playing={playing}
                  disabled={!currentTrack}
                  shuffle={shuffle}
                  repeat={repeat}
                  abLoop={abLoop}
                  onTogglePlay={player.togglePlayPause}
                  onPrev={player.prev}
                  onNext={player.next}
                  onToggleShuffle={player.toggleShuffle}
                  onCycleRepeat={player.cycleRepeat}
                  onCycleAb={() =>
                    player.cycleAbPoint(getPositionSecs())
                  }
                />

                {!isMobile && sep}

                <View
                  style={{
                    flexShrink: 0,
                  }}
                >
                  <Extras
                    volume={player.volume}
                    onSetVolume={player.setVolume}
                    onToggleMute={player.toggleMute}
                    accentColor={accent.base}
                    glowColor={accent.glow}
                  />
                </View>
              </View>

              <ProgressLane
                durationSecs={durationSecs}
                abLoop={abLoop}
                onSeek={player.seek}
                onNudgeAb={player.nudgeAbBound}
                accentColor={accent.base}
                glowColor={accent.glow}
                disabled={!currentTrack}
              />
            </View>
          </GlassSurface>

          <DockLoadingRing />
        </View>
      </Animated.View>
    </View>
  );
}