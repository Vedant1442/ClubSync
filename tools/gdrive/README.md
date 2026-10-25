# Antigravity Google Drive Integration

Connects Antigravity to your Google Drive to automatically save artifacts, documents, markdown files, and exports.

## Files Created

- `client_secret.json`: Your Google OAuth 2.0 Client credentials (`clubsync-auth`).
- `auth.py`: One-time authorization script that launches your browser to grant Drive access and saves tokens to `token.json`.
- `gdrive_client.py`: Core client for interacting with Google Drive API v3 (no third-party dependencies required).
- `upload.py`: Standalone CLI tool to upload any local file or list files in Drive.
- `gdrive_server.py`: Model Context Protocol (MCP) server registered in `~/.gemini/config/mcp_config.json`.

## Quick Start (One-Time Setup)

In your terminal, run:

```bash
python tools/gdrive/auth.py
```

1. Your browser will open asking to sign into your Google account and grant Drive access.
2. Click **Allow** (or Advanced > Proceed if you see an unverified app screen for personal test apps).
3. The script will save `token.json`.

## How Antigravity Uses It

### 1. Via Antigravity Agent Tools (MCP)
The `gdrive` MCP server is registered in `~/.gemini/config/mcp_config.json`. It provides:
- `gdrive_save_artifact`: Saves text/markdown artifacts directly to the "Antigravity Artifacts" folder in Google Drive.
- `gdrive_upload_file`: Uploads any local workspace file/artifact to Google Drive.
- `gdrive_list_files`: Lists existing artifacts and files in your Google Drive folder.

### 2. Via Command Line
```bash
# Upload an artifact or file
python tools/gdrive/upload.py "path/to/artifact.md"

# Upload to a custom folder
python tools/gdrive/upload.py --folder "Project Reports" "report.pdf"

# List files currently in your Drive folder
python tools/gdrive/upload.py --list
```
