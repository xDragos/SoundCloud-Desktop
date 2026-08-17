fn main() {
    tauri_build::build();

    let target = std::env::var("TARGET").unwrap_or_default();
    if target.contains("apple-ios") {
        println!("cargo:rustc-link-lib=framework=MediaPlayer");
        println!("cargo:rustc-link-lib=framework=AVFoundation");
        println!("cargo:rustc-link-lib=framework=CoreAudio");
        println!("cargo:rustc-link-lib=framework=AudioToolbox");
        
        // Asigură că simbolurile din librăria statică souvlaki nu sunt eliminate de dead-code elimination
        println!("cargo:rustc-link-arg=-ObjC");
    }
}
