import os
import sys
import json
import time
import urllib.request
import urllib.parse
import urllib.error
import mimetypes
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
SECRET_FILE = BASE_DIR / "client_secret.json"
TOKEN_FILE = BASE_DIR / "token.json"

SCOPES = [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.metadata.readonly"
]

def load_client_config():
    if not SECRET_FILE.exists():
        raise FileNotFoundError(f"Client secret not found at {SECRET_FILE}")
    with open(SECRET_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    config = data.get("installed") or data.get("web")
    if not config:
        raise ValueError("Invalid client_secret.json structure")
    return config

def get_valid_access_token():
    if not TOKEN_FILE.exists():
        raise PermissionError(
            f"No token found. Please run authentication first: python {BASE_DIR / 'auth.py'}"
        )
    with open(TOKEN_FILE, "r", encoding="utf-8") as f:
        token_data = json.load(f)

    # Check if expired (or within 60s of expiring)
    expires_at = token_data.get("expires_at", 0)
    if time.time() < expires_at - 60 and "access_token" in token_data:
        return token_data["access_token"]

    # Needs refresh
    refresh_token = token_data.get("refresh_token")
    if not refresh_token:
        raise PermissionError("Refresh token missing. Please re-authenticate using auth.py")

    client_config = load_client_config()
    payload = urllib.parse.urlencode({
        "client_id": client_config["client_id"],
        "client_secret": client_config["client_secret"],
        "refresh_token": refresh_token,
        "grant_type": "refresh_token"
    }).encode("utf-8")

    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=payload, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))

    token_data["access_token"] = res["access_token"]
    token_data["expires_at"] = int(time.time()) + res.get("expires_in", 3600)
    with open(TOKEN_FILE, "w", encoding="utf-8") as f:
        json.dump(token_data, f, indent=2)

    return token_data["access_token"]

def api_request(url, method="GET", headers=None, data=None):
    token = get_valid_access_token()
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read()
            if resp.headers.get_content_type() == "application/json":
                return json.loads(content.decode("utf-8"))
            return content
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Google Drive API Error {e.code}: {error_body}")

def get_or_create_folder(folder_name="Antigravity Artifacts"):
    query = f"name = '{folder_name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    url = f"https://www.googleapis.com/drive/v3/files?q={urllib.parse.quote(query)}&fields=files(id,name)"
    res = api_request(url)
    files = res.get("files", [])
    if files:
        return files[0]["id"]

    # Create folder
    create_url = "https://www.googleapis.com/drive/v3/files?fields=id,name"
    metadata = {
        "name": folder_name,
        "mimeType": "application/vnd.google-apps.folder"
    }
    body = json.dumps(metadata).encode("utf-8")
    created = api_request(create_url, method="POST", headers={"Content-Type": "application/json"}, data=body)
    return created["id"]

def upload_file_content(filename, content_bytes, mime_type=None, folder_name="Antigravity Artifacts"):
    if not mime_type:
        mime_type, _ = mimetypes.guess_type(filename)
        if not mime_type:
            mime_type = "application/octet-stream"

    folder_id = get_or_create_folder(folder_name) if folder_name else None

    metadata = {
        "name": filename
    }
    if folder_id:
        metadata["parents"] = [folder_id]

    boundary = f"----AntigravityBoundary{int(time.time()*1000)}"
    delimiter = f"\r\n--{boundary}\r\n".encode("utf-8")
    close_delimiter = f"\r\n--{boundary}--\r\n".encode("utf-8")

    part1_header = b"Content-Type: application/json; charset=UTF-8\r\n\r\n"
    part1_body = json.dumps(metadata).encode("utf-8")

    part2_header = f"Content-Type: {mime_type}\r\n\r\n".encode("utf-8")
    part2_body = content_bytes

    multipart_body = (
        f"--{boundary}\r\n".encode("utf-8") +
        part1_header + part1_body +
        delimiter +
        part2_header + part2_body +
        close_delimiter
    )

    upload_url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,size"
    headers = {
        "Content-Type": f"multipart/related; boundary={boundary}"
    }

    result = api_request(upload_url, method="POST", headers=headers, data=multipart_body)
    return result

def upload_local_file(file_path, folder_name="Antigravity Artifacts"):
    p = Path(file_path)
    if not p.exists():
        raise FileNotFoundError(f"File not found: {file_path}")
    with open(p, "rb") as f:
        content = f.read()
    return upload_file_content(p.name, content, folder_name=folder_name)

def save_text_file(filename, text_content, folder_name="Antigravity Artifacts"):
    content = text_content.encode("utf-8")
    mime_type = "text/markdown" if filename.endswith(".md") else "text/plain"
    return upload_file_content(filename, content, mime_type=mime_type, folder_name=folder_name)

def list_files(folder_name="Antigravity Artifacts", page_size=20):
    folder_id = get_or_create_folder(folder_name) if folder_name else None
    query_parts = ["trashed = false"]
    if folder_id:
        query_parts.append(f"'{folder_id}' in parents")
    query = " and ".join(query_parts)

    url = (
        f"https://www.googleapis.com/drive/v3/files"
        f"?q={urllib.parse.quote(query)}"
        f"&pageSize={page_size}"
        f"&fields=files(id,name,mimeType,webViewLink,modifiedTime,size)"
        f"&orderBy=modifiedTime desc"
    )
    return api_request(url).get("files", [])
