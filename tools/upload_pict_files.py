import sys
from pathlib import Path

# Add tools/gdrive to path
sys.path.insert(0, str(Path(__file__).resolve().parent / "gdrive"))

from gdrive_client import upload_local_file, TOKEN_FILE
import auth

BASE_DIR = Path(__file__).resolve().parent.parent
DOCS_DIR = BASE_DIR / "docs"

FILES_TO_UPLOAD = [
    DOCS_DIR / "ClubSync_Project_Report.pdf",
    DOCS_DIR / "ClubSync_Presentation_Script.pdf"
]

def main():
    if not TOKEN_FILE.exists():
        print("=" * 60)
        print("Google Drive Authorization Required")
        print("=" * 60)
        print("Opening browser to authorize Google Drive...")
        auth.main()

    print("\n" + "=" * 60)
    print("Uploading PICT Dossier PDFs to Google Drive folder 'PICT FILES'")
    print("=" * 60)

    for pdf_path in FILES_TO_UPLOAD:
        if not pdf_path.exists():
            print(f"Error: {pdf_path} not found.")
            continue
        print(f"\nUploading {pdf_path.name}...")
        try:
            res = upload_local_file(pdf_path, folder_name="PICT FILES")
            print(f"  Success!")
            print(f"  Name: {res.get('name')}")
            print(f"  ID:   {res.get('id')}")
            print(f"  Link: {res.get('webViewLink')}")
        except Exception as e:
            print(f"  Failed to upload: {e}")

    print("\nUpload complete! Both PDFs are in your 'PICT FILES' Google Drive folder.")

if __name__ == "__main__":
    main()
