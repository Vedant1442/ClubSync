#!/usr/bin/env python3
import sys
import json
import traceback
from pathlib import Path

# Ensure local imports work
sys.path.insert(0, str(Path(__file__).resolve().parent))

from gdrive_client import (
    upload_local_file,
    save_text_file,
    list_files,
    TOKEN_FILE,
    SECRET_FILE
)

TOOLS = [
    {
        "name": "gdrive_upload_file",
        "description": "Upload a local file or artifact from your machine into Google Drive.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Absolute or workspace-relative path to the file to upload."
                },
                "folder_name": {
                    "type": "string",
                    "description": "Google Drive folder name where the file should be stored (defaults to 'Antigravity Artifacts')."
                }
            },
            "required": ["file_path"]
        }
    },
    {
        "name": "gdrive_save_artifact",
        "description": "Directly create and save markdown/text content as an artifact file in Google Drive without requiring an existing local file.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "filename": {
                    "type": "string",
                    "description": "Target filename in Google Drive (e.g. 'Project_Roadmap.md')."
                },
                "content": {
                    "type": "string",
                    "description": "Text or markdown content to write into the file."
                },
                "folder_name": {
                    "type": "string",
                    "description": "Google Drive folder name (defaults to 'Antigravity Artifacts')."
                }
            },
            "required": ["filename", "content"]
        }
    },
    {
        "name": "gdrive_list_files",
        "description": "List files and artifacts currently stored in your Google Drive folder.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "folder_name": {
                    "type": "string",
                    "description": "Google Drive folder name to inspect (defaults to 'Antigravity Artifacts'). Pass empty string for root."
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of files to return (default 20)."
                }
            }
        }
    }
]

def handle_tool_call(name, args):
    if not TOKEN_FILE.exists():
        return {
            "content": [
                {
                    "type": "text",
                    "text": (
                        "Google Drive is not yet authenticated. Please run the one-time authentication script:\n\n"
                        f"  python tools/gdrive/auth.py\n\n"
                        "This will open your browser to approve Drive access."
                    )
                }
            ]
        }

    folder_name = args.get("folder_name", "Antigravity Artifacts")

    if name == "gdrive_upload_file":
        file_path = args.get("file_path")
        result = upload_local_file(file_path, folder_name=folder_name)
        return {
            "content": [
                {
                    "type": "text",
                    "text": (
                        f"Successfully uploaded '{result.get('name')}' to Google Drive folder '{folder_name}'!\n"
                        f"- File ID: {result.get('id')}\n"
                        f"- View Link: {result.get('webViewLink')}"
                    )
                }
            ]
        }

    if name == "gdrive_save_artifact":
        filename = args.get("filename")
        content = args.get("content")
        result = save_text_file(filename, content, folder_name=folder_name)
        return {
            "content": [
                {
                    "type": "text",
                    "text": (
                        f"Artifact '{result.get('name')}' saved to Google Drive folder '{folder_name}'!\n"
                        f"- File ID: {result.get('id')}\n"
                        f"- View Link: {result.get('webViewLink')}"
                    )
                }
            ]
        }

    if name == "gdrive_list_files":
        limit = args.get("limit", 20)
        files = list_files(folder_name=folder_name, page_size=limit)
        if not files:
            return {
                "content": [
                    {
                        "type": "text",
                        "text": f"No files found in Google Drive folder '{folder_name}'."
                    }
                ]
            }
        lines = [f"Found {len(files)} file(s) in '{folder_name}':"]
        for f in files:
            size_kb = f.get('size', '0')
            try:
                size_str = f" ({int(size_kb)/1024:.1f} KB)"
            except:
                size_str = ""
            lines.append(f"- {f.get('name')}{size_str} [Link: {f.get('webViewLink')}]")

        return {
            "content": [
                {
                    "type": "text",
                    "text": "\n".join(lines)
                }
            ]
        }

    raise ValueError(f"Unknown tool: {name}")

def main():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            req = json.loads(line)
        except Exception:
            continue

        msg_id = req.get("id")
        method = req.get("method")
        params = req.get("params", {})

        if method == "initialize":
            res = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {}
                    },
                    "serverInfo": {
                        "name": "gdrive",
                        "version": "1.0.0"
                    }
                }
            }
            sys.stdout.write(json.dumps(res) + "\n")
            sys.stdout.flush()
            continue

        if method == "notifications/initialized":
            continue

        if method == "ping":
            sys.stdout.write(json.dumps({"jsonrpc": "2.0", "id": msg_id, "result": {}}) + "\n")
            sys.stdout.flush()
            continue

        if method == "tools/list":
            res = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {
                    "tools": TOOLS
                }
            }
            sys.stdout.write(json.dumps(res) + "\n")
            sys.stdout.flush()
            continue

        if method == "tools/call":
            tool_name = params.get("name")
            tool_args = params.get("arguments", {})
            try:
                tool_res = handle_tool_call(tool_name, tool_args)
                response = {
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "result": tool_res
                }
            except Exception as e:
                response = {
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "error": {
                        "code": -32603,
                        "message": str(e)
                    }
                }
            sys.stdout.write(json.dumps(response) + "\n")
            sys.stdout.flush()
            continue

        if msg_id is not None:
            err_res = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "error": {
                    "code": -32601,
                    "message": f"Method not found: {method}"
                }
            }
            sys.stdout.write(json.dumps(err_res) + "\n")
            sys.stdout.flush()

if __name__ == "__main__":
    main()
