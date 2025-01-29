# ใช้ Python เวอร์ชันที่รองรับ
FROM python:3.9

# ตั้งค่า Working Directory
WORKDIR /app

# คัดลอกไฟล์โค้ดทั้งหมดเข้า Container
COPY . /app

# คัดลอก requirements.txt และติดตั้ง dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# เปิดพอร์ตที่ Flask ใช้
EXPOSE 5009

# คำสั่งรันแอป
CMD ["python", "app.py"]