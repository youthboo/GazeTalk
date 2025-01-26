# ใช้ base image
FROM ubuntu:18.04

# อัปเดตระบบและติดตั้ง dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    cmake \
    libsm6 \
    libxext6 \
    libxrender1 \
    libfontconfig1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# อัปเดต pip ให้เป็นเวอร์ชันล่าสุด
RUN pip3 install --no-cache-dir --upgrade pip

# คัดลอกไฟล์โค้ดทั้งหมดลงใน container
COPY . /home/GazeTracking

# ตั้งค่าโฟลเดอร์ทำงาน
WORKDIR /home/GazeTracking

# ติดตั้ง Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# รันคำสั่งเริ่มต้น
CMD ["python3", "example.py"]