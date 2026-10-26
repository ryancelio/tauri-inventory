use std::{
    fs,
    path::{Path, PathBuf},
    sync::atomic::Ordering,
};

use bytes::Bytes;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State, WebviewWindow};
use tauri_plugin_http::reqwest::multipart::{Form, Part};

use crate::{
    config::api_url::get_api_url,
    database::{get_body, get_token, try_connection},
    log::log_to_default,
    ApiResponse, AppState, RustApiError,
};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MercadoriaPhotoListing {
    pub id: i32,
    pub url: String,
}

async fn create_photo_multpart(mut form: Form, files: Vec<String>) -> Result<Form, RustApiError> {
    for path in files {
        let filename = Path::new(&path)
            .file_name()
            .unwrap()
            .to_string_lossy()
            .into_owned();
        let part = match Part::file(&path).await {
            Ok(val) => val,
            Err(e) => {
                println!("{:?}", e);
                return Err(RustApiError {
                    code: 500,
                    message: ApiResponse {
                        response: "Erro interno".to_string(),
                    },
                });
            }
        }
        .file_name(filename);

        form = form.part("images", part);
    }
    Ok(form)
}

#[tauri::command]
pub async fn upload_merc_photo(
    app: AppHandle,
    state: tauri::State<'_, crate::AppState>,
    files: Vec<String>,
    id: i32,
) -> Result<ApiResponse, RustApiError> {
    let token = get_token(&state)?;
    let api_url = get_api_url(&app)?;

    let mut form = Form::new();

    form = create_photo_multpart(form, files).await?;

    let request = state
        .http_client
        .post(format!("{}/photos/mercadorias/{}", api_url, id.to_string()))
        .bearer_auth(token)
        .multipart(form);

    let identifier = &String::from("upload_merc_photo");

    let response = try_connection(request, identifier, &state, &app).await?;

    let body: ApiResponse = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn upload_key_photo(
    app: AppHandle,
    state: tauri::State<'_, crate::AppState>,
    files: Vec<String>,
    merc_key: i32,
) -> Result<ApiResponse, RustApiError> {
    let token = get_token(&state)?;
    let api_url = get_api_url(&app)?;

    let mut form = Form::new();

    form = create_photo_multpart(form, files).await?;

    let request = state
        .http_client
        .post(format!(
            "{}/photos/mercadorias/key/{}",
            api_url,
            merc_key.to_string()
        ))
        .bearer_auth(token)
        .multipart(form);

    let identifier = &String::from("upload_merc_photo");

    let response = try_connection(request, identifier, &state, &app).await?;

    let body: ApiResponse = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn get_merc_photos(
    mercadoria_id: i32,
    app: AppHandle,
    state: tauri::State<'_, crate::AppState>,
) -> Result<Vec<MercadoriaPhotoListing>, RustApiError> {
    {
        let is_offline_mode = state.is_offline_mode.load(Ordering::Relaxed);
        if is_offline_mode {
            let res: Vec<MercadoriaPhotoListing> = vec![];
            return Ok(res);
        }
    }
    let token = get_token(&state)?;
    let api_url = get_api_url(&app)?;

    let request = state
        .http_client
        .get(format!(
            "{api_url}/photos/mercadorias/{}",
            mercadoria_id.to_string()
        ))
        .bearer_auth(token);
    let identifier = &String::from("get_merc_photos");

    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn get_key_photos(
    app: AppHandle,
    state: tauri::State<'_, crate::AppState>,
    mercadoria_key: i32,
) -> Result<Vec<MercadoriaPhotoListing>, RustApiError> {
    {
        let is_offline_mode = state.is_offline_mode.load(Ordering::Relaxed);
        if is_offline_mode {
            let res: Vec<MercadoriaPhotoListing> = vec![];
            return Ok(res);
        }
    }
    let token = get_token(&state)?;
    let api_url = get_api_url(&app)?;

    let request = state
        .http_client
        .get(format!(
            "{api_url}/photos/mercadorias/key/{}",
            mercadoria_key.to_string()
        ))
        .bearer_auth(token);
    let identifier = &String::from("get_merc_photos");

    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn get_merc_images(
    filename: String,
    is_thumb: bool,
    base_url: String,
    app: AppHandle,
    state: State<'_, AppState>,
    // state: AppState,
) -> Result<String, RustApiError> {
    let image_path = get_cached_image_path(&filename, is_thumb, &app).await?;

    if image_path.exists() {
        return Ok(image_path.to_string_lossy().to_string());
    } else {
        let api_url = get_api_url(&app)?;
        let token = get_token(&state)?;

        let mut request_url = format!("{}/{}/", api_url, base_url);

        if is_thumb {
            request_url = format!("{request_url}thumb/")
        }
        request_url = format!("{request_url}/{filename}");

        let request = state
            .http_client
            .get(request_url.clone())
            .bearer_auth(token);

        let identifier = String::from("get_merc_images");
        let response = try_connection(request, &identifier, &state, &app).await?;

        if let Some(ct) = response.headers().get("content-type") {
            let ct_str = ct.to_str().unwrap_or("");
            // log_to_default(&app, &format!("Content-Type: {}", ct_str)).await;
            if !ct_str.starts_with("image/") {
                log_to_default(
                    &app,
                    &format!("Requested URL: {request_url}, API returned a non image response."),
                )
                .await;
                return Err(RustApiError::from_str(
                    "Erro interno ao receber imagem, entre em contato com um administrador.",
                ));
            }
        } else {
            log_to_default(&app, "No content-type header").await;
        }
        let image = response
            .bytes()
            .await
            .map_err(|_| RustApiError::from_str("Erro interno."))?;

        // log_to_default(&app, &format!("Got {} bytes, saving to cache", image.len())).await;
        let new_image_path = create_cached_image(&filename, image.clone(), is_thumb, &app).await?;
        return Ok(new_image_path);
    }
}
#[derive(Deserialize, Serialize)]
pub struct BulkPhotoRequest {
    pub items: Vec<MercadoriaPhotoListing>,
    pub is_thumb: bool,
    pub base_url: String,
}
#[derive(Deserialize, Serialize)]
pub struct BulkPhotoResponse {
    id: i32,
    path: String,
}

#[tauri::command]
pub async fn get_merc_img_bulk(
    requests: BulkPhotoRequest,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<Vec<BulkPhotoResponse>, RustApiError> {
    use futures::future::join_all;
    let futures = requests.items.into_iter().map(|request_item| {
        let app = app.clone();
        let state = state.clone();
        let base_url = requests.base_url.clone();
        async move {
            let img_src =
                get_merc_images(request_item.url, requests.is_thumb, base_url, app, state).await?;
            Ok(BulkPhotoResponse {
                id: request_item.id,
                path: img_src,
            })
        }
    });
    let results = join_all(futures).await;
    results.into_iter().collect()
}

pub async fn get_cached_image_path(
    filename: &String,
    // window: WebviewWindow,
    is_thumb: bool,
    app: &AppHandle,
) -> Result<PathBuf, RustApiError> {
    // Sanitize filename to prevent path traversal
    let sanitized = Path::new(filename)
        .file_name()
        .ok_or_else(|| RustApiError::from_str("Nome de arquivo inválido."))?
        .to_string_lossy()
        .into_owned();

    if sanitized.is_empty() {
        return Err(RustApiError::from_str("Nome de arquivo inválido."));
    }

    let cache_dir = match app.path().app_cache_dir() {
        Ok(cache_dir) => cache_dir,
        Err(err) => {
            log_to_default(&app, &format!("Erro ao abrir pasta de cache: {:?}", err)).await;
            return Err(RustApiError::from_str(
                "Erro interno. Entre em contato com um administrador.",
            ));
        }
    };

    let image_folder: PathBuf = if is_thumb {
        cache_dir.join("images").join("thumb")
    } else {
        cache_dir.join("images")
    };
    let image_path = image_folder.join(sanitized);

    // let ok = window.convert_file_src(image_path, None);

    Ok(image_path)
}

pub async fn create_cached_image(
    filename: &String,
    image_bytes: Bytes,
    is_thumb: bool,
    app: &AppHandle,
) -> Result<String, RustApiError> {
    let sanitized = Path::new(filename)
        .file_name()
        .ok_or_else(|| RustApiError::from_str("Nome de arquivo inválido."))?
        .to_string_lossy()
        .into_owned();

    if sanitized.is_empty() {
        return Err(RustApiError::from_str("Nome de arquivo inválido."));
    }

    let mut img_cache_folder = app
        .path()
        .app_cache_dir()
        .map_err(|_| {
            // log_to_default(&app, &format!("Erro ao abrir arquivo de cache: {:?}", e));
            RustApiError::from_str("Erro interno.")
        })?
        .join("images");

    if is_thumb {
        img_cache_folder = img_cache_folder.join("thumb");
    }
    let file_path = img_cache_folder.join(&sanitized);
    // log_to_default(&app, &format!("Creating cache file at: {:?}", file_path)).await;

    fs::create_dir_all(&img_cache_folder).map_err(|e| {
        log_to_default(&app, &format!("Failed to create dir: {:?}", e));
        RustApiError::from_str("Erro interno.")
    })?;

    fs::write(&file_path, &image_bytes).map_err(|e| {
        log_to_default(&app, &format!("Failed to write file: {:?}", e));
        RustApiError::from_str("Erro interno.")
    })?;
    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn delete_merc_photo(
    id: i32,
    app: AppHandle,
    state: tauri::State<'_, crate::AppState>,
) -> Result<ApiResponse, RustApiError> {
    let token = get_token(&state)?;
    let api_url = get_api_url(&app)?;

    let request = state
        .http_client
        .delete(format!("{api_url}/photos/mercadorias/{id}"))
        .bearer_auth(token);
    let identifier = &String::from("delete_merc_photo");

    let response = try_connection(request, identifier, &state, &app).await?;

    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn delete_key_photo(
    id: i32,
    app: AppHandle,
    state: tauri::State<'_, crate::AppState>,
) -> Result<ApiResponse, RustApiError> {
    let token = get_token(&state)?;
    let api_url = get_api_url(&app)?;

    let request = state
        .http_client
        .delete(format!("{api_url}/photos/mercadorias/key/{id}"))
        .bearer_auth(token);
    let identifier = &String::from("delete_merc_photo");

    let response = try_connection(request, identifier, &state, &app).await?;

    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}
