fn main() {
    tauri_build::build();

    let target = std::env::var("TARGET").unwrap_or_default();
    if target.contains("apple-ios") {
        println!("cargo:rustc-link-lib=framework=MediaPlayer");
        println!("cargo:rustc-link-lib=framework=AVFoundation");
        println!("cargo:rustc-link-lib=framework=CoreAudio");
        println!("cargo:rustc-link-lib=framework=AudioToolbox");

        // Transmite flag-urile direct catre linker-ul nativ (ld / clang)
        println!("cargo:rustc-link-arg=-framework");
        println!("cargo:rustc-link-arg=MediaPlayer");
        println!("cargo:rustc-link-arg=-framework");
        println!("cargo:rustc-link-arg=AVFoundation");
    }
}
