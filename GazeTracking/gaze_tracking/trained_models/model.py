import os
import urllib.request
import bz2
import shutil

# กำหนด URL ของไฟล์ที่ต้องดาวน์โหลด
url = "http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2"
save_path = "shape_predictor_68_face_landmarks.dat.bz2"
extract_path = "shape_predictor_68_face_landmarks.dat"

# ดาวน์โหลดไฟล์
print("Downloading shape_predictor_68_face_landmarks.dat.bz2...")
urllib.request.urlretrieve(url, save_path)
print("Download completed!")

# แตกไฟล์ .bz2
print("Extracting file...")
with bz2.BZ2File(save_path, "rb") as bz2_file:
    with open(extract_path, "wb") as out_file:
        shutil.copyfileobj(bz2_file, out_file)

# ลบไฟล์ .bz2 หลังแตกไฟล์เสร็จ
os.remove(save_path)

print(f"Extraction completed! File saved as: {extract_path}")
