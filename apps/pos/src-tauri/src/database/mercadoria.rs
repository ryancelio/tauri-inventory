use std::sync::atomic::Ordering;

use tauri::{AppHandle, State};

use crate::config::api_url::{self, get_api_url};
use crate::database::mercadoria::types::{
    Mercadoria, MercadoriaKeyListing, MercadoriaReportResponse, MercadoriaSimple, PartialMercDB,
    SimilarMercCreate,
};
use crate::database::{get_body, get_token, try_connection};
use crate::offline::database::off_mercadorias::{
    offline_get_mercadoria_report, offline_get_mercadorias, offline_get_similar_mercs,
    offline_get_single_mercadoria,
};
use crate::{database::ApiListResponse, ApiResponse, AppState, RustApiError};

pub mod types;

#[tauri::command]
pub async fn get_mercadorias(
    filter: types::MercadoriaFilter,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiListResponse<types::Mercadoria>, RustApiError> {
    {
        let is_offline_mode = state.is_offline_mode.load(Ordering::Relaxed);

        if is_offline_mode {
            return offline_get_mercadorias(filter, state).await;
        }
    }
    let token = get_token(&state)?;

    let api_url = get_api_url(&app);

    let request = state
        .http_client
        .get(format!("{api_url}/mercadorias"))
        .json(&filter)
        .bearer_auth(token);

    let identifier = String::from("get_mercadorias");

    let response = try_connection(request, &identifier, &state, &app).await?;

    let body = get_body::<ApiListResponse<types::Mercadoria>>(&app, response, &identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn get_single_mercadoria(
    id: i32,
    get_all: Option<bool>,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<types::Mercadoria, RustApiError> {
    {
        let is_offline_mode = state.is_offline_mode.load(Ordering::Relaxed);

        if is_offline_mode {
            return offline_get_single_mercadoria(id, &state).await;
        }
    }

    let api_url = get_api_url(&app);

    let token = get_token(&state)?;

    let mut url = format!("{api_url}/mercadorias/{id}");

    if let Some(get_all) = get_all {
        url = format!("{url}?all={get_all}");
    }

    let request = state.http_client.get(url).bearer_auth(token);

    let identifier = &String::from("get_single_mercadoria");

    let response = try_connection(request, identifier, &state, &app).await?;

    let body = get_body::<types::Mercadoria>(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn get_mercadoria_report(
    filter: types::MercadoriaFilter,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiListResponse<MercadoriaReportResponse>, RustApiError> {
    let is_offline_mode = state.is_offline_mode.load(Ordering::Relaxed);
    if is_offline_mode {
        return offline_get_mercadoria_report(filter, &state).await;
    }

    let api_url = get_api_url(&app);

    let token = get_token(&state)?;

    let request = state
        .http_client
        .get(format!("{api_url}/mercadorias/relatorio"))
        .bearer_auth(token)
        .json(&filter);

    let identifier = &String::from("get_mercadoria_report");
    let response = try_connection(request, identifier, &state, &app).await?;

    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn get_mercadoria_key_listing(
    query: Option<String>,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<Vec<MercadoriaKeyListing>, RustApiError> {
    let api_url = get_api_url(&app);
    let token = get_token(&state)?;

    let url = match query {
        Some(q) => format!("{api_url}/mercadorias/keys/listing?q={q}"),
        None => format!("{api_url}/mercadorias/keys/listing"),
    };

    let request = state.http_client.get(url).bearer_auth(token);

    let identifier = &String::from("get_mercadoria_report");
    let response = try_connection(request, identifier, &state, &app).await?;

    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn get_similar_mercs(
    key: i32,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<Vec<types::SimilarMerc>, RustApiError> {
    {
        let is_offline_mode = state.is_offline_mode.load(Ordering::Relaxed);
        if is_offline_mode {
            return offline_get_similar_mercs(key, state).await;
        }
    }
    let api_url = get_api_url(&app);

    let token = get_token(&state)?;

    let request = state
        .http_client
        .get(format!("{api_url}/mercadorias/similar/{key}"))
        .bearer_auth(token);

    let identifier = &String::from("get_similar_merc");

    let response = try_connection(request, identifier, &state, &app).await?;

    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

// #[tauri::command]
// pub async fn update_all_similar_mercs(
//     state: State<'_, AppState>,
//     mercadoria: SimilarMercCreate,
//     key: i32,
//     app: AppHandle,
// ) -> Result<ApiResponse, RustApiError> {
//     let api_url = get_api_url(&app);

//     let token = get_token(&state)?;

//     let request = state
//         .http_client
//         .put(format!("{api_url}/mercadorias/similar/all/{key}"))
//         .bearer_auth(token)
//         .json(&mercadoria);

//     let identifier = &String::from("update_all_similar_mercs");

//     let response = try_connection(request, identifier, &state, &app).await?;

//     let body = get_body::<ApiResponse>(&app, response, identifier).await?;

//     Ok(body)
// }

#[tauri::command]
pub async fn update_similar_by_id(
    state: State<'_, AppState>,
    key: i32,
    mercadoria: SimilarMercCreate,
    selected_ids: Vec<String>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app);
    let token = get_token(&state)?;

    let payload = types::UpdateSimMercIdPayload {
        mercadoria: mercadoria,
        selected_ids: selected_ids,
    };

    let request = state
        .http_client
        .put(format!("{api_url}/mercadorias/similar/{key}"))
        .bearer_auth(token)
        .json(&payload);

    let identifier = &String::from("update_similar_by_id");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body::<ApiResponse>(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn update_mercadoria(
    mercadoria: types::MercadoriaUpdate,
    id: i32,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app);
    let token = get_token(&state)?;
    println!("{:?}", mercadoria.clone());

    let request = state
        .http_client
        .put(format!("{api_url}/mercadorias/{id}"))
        .bearer_auth(token)
        .json(&mercadoria);

    let identifier = &String::from("update_mercadoria");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body::<ApiResponse>(&app, response, identifier).await?;

    println!("Reached rust last line");

    Ok(body)
}

#[tauri::command]
pub async fn create_mercadoria(
    mercadoria: types::MercadoriaCreate,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<PartialMercDB, RustApiError> {
    let api_url = get_api_url(&app);
    let token = get_token(&state)?;

    let request = state
        .http_client
        .post(format!("{api_url}/mercadorias"))
        .bearer_auth(token)
        .json(&mercadoria);

    let identifier = &String::from("create_mercadoria");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body::<PartialMercDB>(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn delete_mercadoria(
    id: i32,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app);
    let token = get_token(&state)?;

    let request = state
        .http_client
        .delete(format!("{api_url}/mercadorias/{id}"))
        .bearer_auth(token);

    let identifier = &String::from("delete_mercadoria");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body::<ApiResponse>(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn get_mercadorias_simple(
    search: &'_ str,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<Vec<MercadoriaSimple>, RustApiError> {
    let api_url = get_api_url(&app);
    let token = get_token(&state)?;

    let request = state
        .http_client
        .get(format!("{api_url}/mercadorias/simple?q={search}"))
        .bearer_auth(token);

    let identifier = &String::from("delete_mercadoria");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body::<Vec<MercadoriaSimple>>(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn get_mercadorias_simple_log(
    search: &'_ str,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<Vec<MercadoriaSimple>, RustApiError> {
    let api_url = get_api_url(&app);
    let token = get_token(&state)?;

    let request = state
        .http_client
        .get(format!("{api_url}/mercadorias/simple/log?q={search}"))
        .bearer_auth(token);

    let identifier = &String::from("delete_mercadoria");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body::<Vec<MercadoriaSimple>>(&app, response, identifier).await?;

    Ok(body)
}
