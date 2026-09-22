use crate::ApiResponse;
use crate::RustApiError;
use std::{fs::File, io::Write, process::Command};

#[tauri::command]
pub fn get_printers() -> Result<Vec<String>, RustApiError> {
    #[cfg(target_os = "windows")]
    {
        let output = match Command::new("powershell")
            .args(["-Command", "(Get-WmiObject -Class Win32_Printer).Name"])
            .output()
        {
            Ok(val) => val,
            Err(e) => {
                println!("{e}");
                return {
                    use crate::ApiResponse;

                    Err(RustApiError {
                        code: 500,
                        message: ApiResponse {
                            response: "Erro ao imprimir.".to_string(),
                        },
                    })
                };
            }
        };

        let stdout = String::from_utf8_lossy(&output.stdout);
        let printers: Vec<String> = stdout
            .lines()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();

        Ok(printers)
    }

    #[cfg(not(target_os = "windows"))]
    {
        let output = match Command::new("lpstat").arg("-a").output() {
            Ok(val) => val,
            Err(e) => {
                println!("{e}");
                return {
                    use crate::ApiResponse;

                    Err(RustApiError {
                        code: 500,
                        message: ApiResponse {
                            response: "Erro ao imprimir.".to_string(),
                        },
                    })
                };
            }
        };
        let stdout = String::from_utf8_lossy(&output.stdout);
        let printers: Vec<String> = stdout
            .lines()
            .filter_map(|l| l.split_whitespace().next().map(|s| s.to_string()))
            .collect();

        Ok(printers)
    }
}

#[tauri::command]
pub async fn print_pdf(
    printer_name: String,
    pdf_bytes: Vec<u8>,
) -> Result<ApiResponse, RustApiError> {
    let temp_dir = std::env::temp_dir();
    let file_path = temp_dir.join(format!(
        "relatorio_{}.pdf",
        std::time::UNIX_EPOCH.elapsed().unwrap().as_millis()
    ));
    let mut file = match File::create(&file_path) {
        Ok(val) => val,
        Err(e) => {
            println!("{e}");
            return Err(RustApiError {
                code: 500,
                message: ApiResponse {
                    response: "Erro ao imprimir".to_string(),
                },
            });
        }
    };

    match file.write_all(&pdf_bytes) {
        Err(e) => {
            println!("{e}");
            return Err(RustApiError {
                code: 500,
                message: ApiResponse {
                    response: "Erro ao imprimir".to_string(),
                },
            });
        }
        _ => (),
    }

    #[cfg(target_os = "windows")]
    {
        use crate::ApiResponse;

        let command = format!("Start-Process -FilePath '{}' -Verb PrintTo '{}' -PassThru | %{{sleep 5;$_}} | stop-process", file_path.display(), printer_name);

        let status = Command::new("powershell")
            .args(["-WindowStyle", "Hidden", "-Command", &command])
            .status()
            .map_err(|e| RustApiError {
                code: 500,
                message: ApiResponse {
                    response: format!("{e}"),
                },
            })?;

        if status.success() {
            Ok(ApiResponse {
                response: "Relatorio impresso com sucesso!".to_string(),
            })
        } else {
            Err(RustApiError {
                code: 500,
                message: ApiResponse {
                    response: "Falha ao imprimir".to_string(),
                },
            })
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        let status = Command::new("lp")
            .args(["-d", &printer_name, &file_path.to_string_lossy()])
            .status()
            .map_err(|e| RustApiError {
                code: 500,
                message: ApiResponse {
                    response: format!("{e}"),
                },
            })?;

        if status.success() {
            Ok(ApiResponse {
                response: "Relatorio impresso com sucesso!".to_string(),
            })
        } else {
            Err(RustApiError {
                code: 500,
                message: ApiResponse {
                    response: "Falha ao imprimir".to_string(),
                },
            })
        }
    }
}
