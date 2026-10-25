import sys
import argparse
from pathlib import Path
from gdrive_client import upload_local_file, list_files, save_text_file

def main():
    parser = argparse.ArgumentParser(description="Upload files or artifacts to Google Drive")
    parser.add_argument("file", nargs="?", help="Path to local file to upload")
    parser.add_argument("--folder", default="Antigravity Artifacts", help="Google Drive folder name (default: 'Antigravity Artifacts')")
    parser.add_argument("--list", action="store_true", help="List files in the Google Drive folder")
    parser.add_argument("--name", help="Custom destination file name")

    args = parser.parse_args()

    if args.list:
        print(f"Listing files in folder '{args.folder}'...")
        files = list_files(folder_name=args.folder)
        if not files:
            print("No files found.")
            return
        for f in files:
            size_kb = f.get('size', '0')
            try:
                size_str = f"{int(size_kb)/1024:.1f} KB"
            except:
                size_str = ""
            print(f"- {f['name']} ({size_str}) -> {f.get('webViewLink', 'No link')}")
        return

    if not args.file:
        parser.print_help()
        sys.exit(1)

    target_path = Path(args.file)
    if not target_path.exists():
        print(f"Error: File '{args.file}' does not exist.")
        sys.exit(1)

    print(f"Uploading '{target_path.name}' to Google Drive folder '{args.folder}'...")
    res = upload_local_file(target_path, folder_name=args.folder)
    print("\n File uploaded successfully!")
    print(f"  Name: {res.get('name')}")
    print(f"  ID:   {res.get('id')}")
    if res.get('webViewLink'):
        print(f"  Link: {res.get('webViewLink')}")

if __name__ == "__main__":
    main()
