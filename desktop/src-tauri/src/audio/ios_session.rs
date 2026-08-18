//! iOS `AVAudioSession` setup.
//!
//! `cpal` opens a Core Audio stream on iOS but does NOT configure
//! `AVAudioSession` itself — that's the app's responsibility. Without an
//! active `.playback` category session:
//!   - iOS silences audio output entirely once the app backgrounds or the
//!     screen locks, regardless of `UIBackgroundModes` in Info.plist.
//!   - The hardware silent switch mutes playback (categories other than
//!     `.playback`/`.playAndRecord` respect it; `.playback` does not).
//!
//! Must run once, early, before the first `cpal` output stream opens
//! (`state::init()` calls this before spawning the `audio-output` thread).
#![cfg(target_os = "ios")]

use objc2_avf_audio::{AVAudioSession, AVAudioSessionCategoryPlayback};

/// Activate a `.playback` `AVAudioSession`. Best-effort: failures are logged,
/// never panic — a mis-set session degrades to foreground-only / silent-switch
/// audio rather than crashing playback outright.
pub fn configure() {
    unsafe {
        let session = AVAudioSession::sharedInstance();

        // AVAudioSessionCategoryPlayback is a `static NSString*` constant in the
        // Apple SDK (see AVAudioSession.h), not an enum — objc2 exposes it as a
        // module-level static, not an associated const on some `*Category` type.
        // objc2 types externs as `Option<&NSString>` (they could theoretically be
        // absent at link time); this constant is always present on iOS/tvOS/macOS,
        // so unwrapping is safe.
        let category = AVAudioSessionCategoryPlayback
            .expect("AVAudioSessionCategoryPlayback missing from AVFAudio");
        if let Err(err) = session.setCategory_error(category) {
            eprintln!("[audio][ios] setCategory(.playback) failed: {err:?}");
        }

        if let Err(err) = session.setActive_error(true) {
            eprintln!("[audio][ios] session setActive(true) failed: {err:?}");
        } else {
            println!("[audio][ios] AVAudioSession active (.playback)");
        }
    }
}
