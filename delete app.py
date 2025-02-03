from flask import Flask, request, send_file, jsonify
from pytube import YouTube  # Make sure to install this: pip install pytube
import os

app = Flask(__name__)

# Folder to store downloaded files temporarily
DOWNLOAD_FOLDER = "downloads"
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)

@app.route('/download')
def download():
    video_url = request.args.get('url')
    quality = request.args.get('quality')
    format = request.args.get('format')

    if not video_url:
        return jsonify({"error": "Video URL is required"}), 400

    try:
        # Create a YouTube object
        yt = YouTube(video_url)

        # Filter streams based on format and quality
        if format == "mp4":
            video_stream = yt.streams.filter(file_extension="mp4", res=quality).first()
        elif format == "mp3":
            video_stream = yt.streams.filter(only_audio=True, file_extension="mp4").first()
        
        if not video_stream:
            return jsonify({"error": "Requested quality or format not available"}), 404

        # Download the file
        downloaded_file_path = video_stream.download(output_path=DOWNLOAD_FOLDER)

        # Rename file to .mp3 if needed
        if format == "mp3":
            mp3_path = os.path.splitext(downloaded_file_path)[0] + ".mp3"
            os.rename(downloaded_file_path, mp3_path)
            downloaded_file_path = mp3_path

        return send_file(downloaded_file_path, as_attachment=True, download_name=f"youtube_video.{format}")
    
    except Exception as e:
        print(f"Error during download: {e}")
        return jsonify({"error": "Failed to download video"}), 500

    finally:
        # Optional: Cleanup the downloaded file after sending (for single-use cases)
        if os.path.exists(downloaded_file_path):
            os.remove(downloaded_file_path)

if __name__ == "__main__":
    app.run(port=5000)
