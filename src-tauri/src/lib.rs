// 防止在 Windows 正式版中弹出控制台窗口
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 删掉了报错的 .plugin(...) 行，确保编译通过
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}