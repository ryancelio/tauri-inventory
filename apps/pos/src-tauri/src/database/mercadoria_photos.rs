use std::{path::Path, sync::atomic::Ordering};

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_http::reqwest::multipart::{Form, Part};

use crate::{
    config::api_url::get_api_url,
    database::{get_body, get_token, try_connection},
    ApiResponse, RustApiError,
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
