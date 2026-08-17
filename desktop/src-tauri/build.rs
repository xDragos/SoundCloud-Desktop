fn main() {
    tauri_build::build();

    let target = std::env::var("TARGET").unwrap_default();
    if target.contains("apple-ios") {
        println!("cargo:rustc-link-lib=framework=MediaPlayer");
        println!("cargo:rustc-link-lib=framework=AVFoundation");
        println!("cargo:rustc-link-lib=framework=CoreAudio");
        println!("cargo:rustc-link-lib=framework=AudioToolbox");
    }
}
