# app.py
from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson.objectid import ObjectId # ใช้สำหรับจัดการ ObjectId ของ MongoDB
import os
import datetime 
from flask_cors import CORS 
from dotenv import load_dotenv 

# โหลดตัวแปรจากไฟล์ .env (ถ้ามี)
load_dotenv() 

# --- Configuration ---
# A: ดึงค่าจาก MONGO_URI ใน Environment (มาจาก .env หรือ OS) 
#    ถ้าไม่พบ ให้ใช้ 'mongodb://localhost:27017/' เป็น Fallback
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
DB_NAME = os.environ.get('DB_NAME', 'smart_info_kiosk')

# ตั้งค่า Secret Key สำหรับ Flask (จะถูกโหลดจาก .env ถ้ามีการกำหนดไว้)
SECRET_KEY = os.environ.get('SECRET_KEY', 'default_fallback')

# --- Initialization ---
app = Flask(__name__)
app.config['SECRET_KEY'] = SECRET_KEY

# *** แก้ไข: เปิดใช้งาน CORS สำหรับทุก Origin เพื่อให้ Frontend เชื่อมต่อได้ ***
CORS(app, resources={r"/api/*": {"origins": "*"}}) 

# เชื่อมต่อ MongoDB
try:
    mongo_client = MongoClient(MONGO_URI)
    db = mongo_client[DB_NAME]
    
    # Collections ที่เราจะใช้
    rooms_col = db['Rooms']
    staff_col = db['Staff']
    log_col = db['Attendance']
    
    print("MongoDB connected successfully.")
    
except Exception as e:
    # จะแสดงข้อความ ERROR ชัดเจนถ้า URI ใน .env ไม่ถูกต้อง
    print(f"ERROR: Could not connect to MongoDB: {e}")
    exit(1)

# ---------------------------------------------------------------------
# 2. API Endpoints
# ---------------------------------------------------------------------

# A. API สำหรับ Next.js Frontend: ดึงข้อมูลสถานะและ Dashboard
@app.route('/api/teacher/status', methods=['GET'])
def get_teacher_status():
    """ดึงข้อมูลครูและสถานะห้องทั้งหมดสำหรับแสดงบน Dashboard"""
    
    teachers = list(staff_col.find({}, {'face_encoding': 0}))
    rooms = list(rooms_col.find({}))
    
    # แปลง ObjectId และ datetime เป็น string ก่อนส่งเป็น JSON
    for doc in teachers:
        if '_id' in doc:
            doc['_id'] = str(doc['_id'])
    for doc in rooms:
        if '_id' in doc:
            doc['_id'] = str(doc['_id'])
    
    return jsonify({
        "teachers": teachers,
        "rooms": rooms,
        "timestamp": datetime.datetime.now().isoformat()
    }), 200

# B. API สำหรับ Python AI Logic: รับคำสั่ง UNLOCK/LOG (POST)
@app.route('/api/room/update', methods=['POST'])
def update_room_status():
    """รับคำสั่งจาก Python AI Logic เพื่ออัปเดตสถานะล็อคประตูใน MongoDB"""
    data = request.get_json()
    room_id = data.get('room_id')
    new_status = data.get('status')  # 'LOCK' หรือ 'UNLOCK'
    
    if not room_id or new_status not in ['LOCK', 'UNLOCK']:
        return jsonify({"message": "Invalid parameters."}), 400
        
    try:
        result = rooms_col.update_one(
            {'room_id': room_id},
            {'$set': {'lock_status': new_status}}
        )
        
        if result.modified_count == 0:
            return jsonify({"message": f"Room {room_id} not found or status already {new_status}."}), 404
            
        print(f"✅ DB UPDATE: Room {room_id} status changed to {new_status}")
        return jsonify({"message": f"Status updated to {new_status}", "room_id": room_id}), 200

    except Exception as e:
        print(f"Error updating room status: {e}")
        return jsonify({"message": "Server error during DB update."}), 500

# C. API สำหรับ Arduino/IoT: ดึงสถานะล็อค (GET)
@app.route('/api/room/status/<room_id>', methods=['GET'])
def get_room_lock_status(room_id):
    """Arduino/IoT ดึงสถานะล็อคของห้องตัวเอง"""
    room = rooms_col.find_one({'room_id': room_id}, {'lock_status': 1, 'room_id': 1})
    
    if room:
        return jsonify({"room_id": room_id, "lock_status": room['lock_status']}), 200
    else:
        return jsonify({"message": f"Room ID {room_id} not found."}), 404

# D. API สำหรับ Logging (Staff Access & Student Attendance)
@app.route('/api/log/access', methods=['POST'])
def log_access_event():
    """
    รับ Log การเข้าถึงประตู (Staff) หรือการเช็คชื่อ (Student) จาก Python Core AI Logic
    """
    data = request.get_json()
    
    # ตรวจสอบพารามิเตอร์ที่จำเป็น
    required_fields = ['user_id', 'user_type', 'room_id', 'status', 'reason']
    if not all(field in data for field in required_fields):
        return jsonify({"message": "Missing required log fields."}), 400

    try:
        log_entry = {
            "user_id": data['user_id'],
            "user_type": data['user_type'], # Staff หรือ Student
            "room_id": data['room_id'],
            "status": data['status'], # GRANTED, DENIED, Present, Late
            "reason": data['reason'],
            "timestamp": datetime.datetime.now() # บันทึกเวลาปัจจุบันที่ API รับ
        }
        
        # บันทึกลงใน Collection Attendance (ใช้เป็นตารางรวม Log)
        result = log_col.insert_one(log_entry)
        
        print(f"✅ LOG ACCESS: {data['user_id']} ({data['status']}) recorded.")
        return jsonify({"message": "Log recorded successfully", "id": str(result.inserted_id)}), 201

    except Exception as e:
        print(f"Error during logging: {e}")
        return jsonify({"message": "Server error during logging process."}), 500