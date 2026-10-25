import sys
import json
import time
import socket
import webbrowser
import urllib.parse
import urllib.request
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler

BASE_DIR = Path(__file__).resolve().parent
SECRET_FILE = BASE_DIR / "client_secret.json"
TOKEN_FILE = BASE_DIR / "token.json"

SCOPES = [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.metadata.readonly"
]

def log(msg):
    print(msg, flush=True)

def find_available_port(start_port=8085):
    for port in range(start_port, start_port + 20):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", port)) != 0:
                return port
    return start_port

class OAuthCallbackHandler(BaseHTTPRequestHandler):
    auth_code = None

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        if "code" in params:
            OAuthCallbackHandler.auth_code = params["code"][0]
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            success_html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Antigravity - Google Drive Connected</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; }
                    .card { background: #1e293b; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; max-width: 480px; border: 1px solid #334155; }
                    h1 { color: #38bdf8; margin-top: 0; font-size: 24px; }
                    p { color: #94a3b8; font-size: 16px; line-height: 1.5; }
                    .badge { display: inline-block; background: #0284c7; color: white; padding: 8px 16px; border-radius: 9999px; font-weight: 600; margin-top: 16px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>Authentication Successful!</h1>
                    <p>Antigravity is now connected to your Google Drive.</p>
                    <p>You can close this browser tab and return to Antigravity.</p>
                    <div class="badge">Google Drive Connected</div>
                </div>
            </body>
            </html>
            """
            self.wfile.write(success_html.encode("utf-8"))
        else:
            error = params.get("error", ["Unknown error"])[0]
            self.send_response(400)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(f"Authentication failed: {error}".encode("utf-8"))

    def log_message(self, format, *args):
        # Suppress server request logging
        return

def main():
    if not SECRET_FILE.exists():
        print(f"Error: Client secret file not found at {SECRET_FILE}")
        sys.exit(1)

    with open(SECRET_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    config = data.get("installed") or data.get("web")
    if not config:
        print("Error: Invalid client_secret.json format.")
        sys.exit(1)

    client_id = config["client_id"]
    client_secret = config["client_secret"]

    port = find_available_port(8085)
    redirect_uri = f"http://localhost:{port}"

    auth_params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent"
    }
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(auth_params)}"

    server = HTTPServer(("127.0.0.1", port), OAuthCallbackHandler)
    server.timeout = 180

    print("=" * 60, flush=True)
    print("Google Drive Authorization for Antigravity", flush=True)
    print("=" * 60, flush=True)
    print(f"\nOpening browser for authorization...\n", flush=True)
    print(f"If your browser does not open automatically, visit this URL:\n\n{auth_url}\n", flush=True)
    webbrowser.open(auth_url)

    print(f"Waiting for authorization callback on port {port}...", flush=True)
    while OAuthCallbackHandler.auth_code is None:
        server.handle_request()

    code = OAuthCallbackHandler.auth_code
    print("\nAuthorization code received! Exchanging for tokens...")

    token_payload = urllib.parse.urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": redirect_uri
    }).encode("utf-8")

    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=token_payload, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")

    try:
        with urllib.request.urlopen(req) as resp:
            token_response = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"Token exchange failed ({e.code}): {e.read().decode('utf-8')}")
        sys.exit(1)

    token_data = {
        "access_token": token_response["access_token"],
        "refresh_token": token_response.get("refresh_token"),
        "expires_at": int(time.time()) + token_response.get("expires_in", 3600),
        "scope": token_response.get("scope"),
        "created_at": int(time.time())
    }

    with open(TOKEN_FILE, "w", encoding="utf-8") as f:
        json.dump(token_data, f, indent=2)

    print("\n Success! Google Drive token saved to:")
    print(f"  {TOKEN_FILE}")
    print("\nYou can now save artifacts and upload files directly to Google Drive!")

if __name__ == "__main__":
    main()
