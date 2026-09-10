use chrono::{Datelike, Local, Timelike};
use std::fs::File;
use std::io::Write;
use tauri::{AppHandle, Manager};


const LOG_FILE_PATH: &str = "/home/zen/inventory.log"; // TODO - Default log target folder

pub async fn log_to_default(app: &AppHandle, content: &str) {
    match app.path().app_log_dir() {
        Ok(log_file_path) => {
            println!("{}",log_file_path.to_string_lossy());
            let mut f = File::options()
                .append(true)
                .write(true)
                .create(true)
                .open(log_file_path)
                .map_err(|error| {
                    println!("Erro ao abrir arquivo de log: {}", error.to_string());
                    return;
                })
                .unwrap();

            let now = Local::now();

            // Format: [YYYY-MM-DD HH-MM-SS] <LOG MESSAGE>
            let buffer = format!(
                "[{}-{:02}-{:02} {:02}:{:02}:{:02}] {}\n",
                now.year(),
                now.month(),
                now.day(),
                now.hour(),
                now.minute(),
                now.second(),
                &content,
            );
            f.write_all(&buffer.as_bytes())
                .map_err(|e| {
                    println!(
                        "Erro ao escrver ao arquivo de log aberto: {}",
                        e.to_string()
                    );
                    return;
                })
                .unwrap();
        }
        Err(e) => {
            println!("Erro interno ao salvar log {}", e.to_string());
        }
    }
}
