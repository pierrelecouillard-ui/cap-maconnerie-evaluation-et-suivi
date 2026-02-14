#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    app_lib::run(); // <-- remplace "app_lib" par le nom trouvé dans Cargo.toml
}
