FROM python:3.9-slim

# ตั้งค่า environment variables เพื่อหลีกเลี่ยงปัญหาการ prompt ของ apt
ENV DEBIAN_FRONTEND=noninteractive

# ติดตั้ง dependencies ที่จำเป็น
RUN apt-get update && apt-get install -y \
    cmake \
    gcc \
    g++ \
    libsm6 \
    libxext6 \
    libxrender1 \
    libfontconfig1 \
    libgl1-mesa-glx \  
    libglib2.0-0 \  
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# อัพเกรด pip
RUN pip3 install --upgrade pip

# คัดลอก requirements.txt ก่อน
COPY requirements.txt /GazeTracking/

# กำหนด working directory
WORKDIR /GazeTracking

# ติดตั้ง Python dependencies โดยใช้ cache
RUN pip3 install -r requirements.txt --no-cache-dir -i https://pypi.org/simple

# คัดลอกไฟล์โค้ดทั้งหมด
COPY . /GazeTracking

EXPOSE 81

# กำหนด command เริ่มต้น
CMD ["python3", "example.py"]



