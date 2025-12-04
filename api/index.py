from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson.objectid import ObjectId
import os
import datetime 
from flask_cors import CORS 
from dotenv import load_dotenv 
from werkzeug.security import generate_password_hash, check_password_hash

# โหลดตัวแปรจาก .env
load_dotenv() 

# --- Configuration ---
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
DB_NAME = os.environ.get('DB_NAME', 'smart_info_kiosk')
SECRET_KEY = os.environ.get('SECRET_KEY', 'default_fallback')

app = Flask(__name__)
app.config['SECRET_KEY'] = SECRET_KEY
CORS(app, resources={r"/api/*": {"origins": "*"}}) 

# ---------------------------------------------------------------------
# Database Connection
# ---------------------------------------------------------------------
try:
    mongo_client = MongoClient(MONGO_URI)
    db = mongo_client[DB_NAME]
    
    # ประกาศ Collections ทั้งหมด
    rooms_col = db['Rooms']
    staff_col = db['Staff']
    log_col = db['Attendance']
    students_col = db['Students']
    users_col = db['Users']
    
    print("MongoDB connected successfully.")
    
except Exception as e:
    print(f"ERROR: Could not connect to MongoDB: {e}")
    exit(1)

# ---------------------------------------------------------------------
# 1. Auth API (Login / Register)
# ---------------------------------------------------------------------

@app.route('/api/auth/register', methods=['POST'])
def register():
    """ลงทะเบียนผู้ดูแลระบบใหม่"""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')

    if not email or not password:
        return jsonify({"message": "Email and Password are required"}), 400

    if users_col.find_one({"email": email}):
        return jsonify({"message": "Email already exists"}), 409

    hashed_password = generate_password_hash(password)

    new_user = {
        "email": email,
        "password": hashed_password,
        "full_name": full_name,
        "created_at": datetime.datetime.now()
    }
    
    users_col.insert_one(new_user)
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    """เข้าสู่ระบบ"""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = users_col.find_one({"email": email})
    
    # Master Password
    if password == "admin1234":
        return jsonify({
            "message": "Login successful",
            "user": {
                "email": "admin@system",
                "full_name": "System Administrator"
            }
        }), 200

    if user and check_password_hash(user['password'], password):
        return jsonify({
            "message": "Login successful",
            "user": {
                "email": user['email'],
                "full_name": user.get('full_name', 'User')
            }
        }), 200
    else:
        return jsonify({"message": "Invalid email or password"}), 401

# ---------------------------------------------------------------------
# 2. Staff / Teacher API (จัดการข้อมูลครู)
# ---------------------------------------------------------------------

@app.route('/api/teacher/status', methods=['GET'])
def get_teacher_status():
    """ดึงข้อมูลครูและสถานะห้องทั้งหมดสำหรับ Dashboard"""
    try:
        # [CONF_FIX] เปลี่ยนมาใช้ 'face_vector': 0 เท่านั้น เพื่อให้ตรงกับ Schema ที่ใช้ใน seed_data.py
        teachers = list(staff_col.find({}, {'face_vector': 0}))
        rooms = list(rooms_col.find({}))
        
        for doc in teachers:
            if '_id' in doc: doc['_id'] = str(doc['_id'])
        for doc in rooms:
            if '_id' in doc: doc['_id'] = str(doc['_id'])
        
        return jsonify({
            "teachers": teachers,
            "rooms": rooms,
            "timestamp": datetime.datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route('/api/staff/add', methods=['POST'])
def add_staff():
    """เพิ่มข้อมูลครูใหม่"""
    try:
        data = request.get_json()
        staff_id = data.get('staff_id')
        
        if staff_col.find_one({'staff_id': staff_id}):
            return jsonify({"message": "Staff ID already exists"}), 409
            
        new_staff = {
            "staff_id": staff_id,
            "full_name": data.get('full_name'),
            "department": data.get('department'),
            "email": data.get('email', ''),
            "face_vector": [], 
            "schedule": []
        }
        
        staff_col.insert_one(new_staff)
        print(f"✅ STAFF ADDED: {staff_id}")
        return jsonify({"message": "Staff added successfully"}), 201

    except Exception as e:
        print(f"Error adding staff: {e}")
        return jsonify({"message": "Server error"}), 500

@app.route('/api/staff/update', methods=['PUT'])
def update_staff():
    """แก้ไขข้อมูลครู"""
    try:
        data = request.get_json()
        staff_id = data.get('staff_id')
        
        if not staff_id:
            return jsonify({"message": "Staff ID is required"}), 400

        update_data = {
            "full_name": data.get('full_name'),
            "department": data.get('department'),
            "email": data.get('email')
        }
        # กรองเอาเฉพาะ field ที่มีการส่งค่ามา
        update_data = {k: v for k, v in update_data.items() if v is not None}

        result = staff_col.update_one(
            {'staff_id': staff_id},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({"message": "Staff ID not found"}), 404
            
        print(f"✅ STAFF UPDATED: {staff_id}")
        return jsonify({"message": "Staff updated successfully"}), 200

    except Exception as e:
        print(f"Error updating staff: {e}")
        return jsonify({"message": "Server error"}), 500

# ---------------------------------------------------------------------
# 3. Student API (จัดการข้อมูลนักเรียน - รวม Admin และ Student Service)
# ---------------------------------------------------------------------

@app.route('/api/students', methods=['GET']) 
def get_all_students():
    """ดึงข้อมูลนักเรียนทั้งหมด (สำหรับ Admin List)"""
    try:
        students = list(students_col.find({}, {'face_vector': 0}))
        for doc in students:
            doc['_id'] = str(doc['_id'])
        return jsonify(students), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route('/api/student/<student_id>', methods=['GET'])
def get_student_info(student_id):
    """
    ค้นหาข้อมูลนักเรียนรายคน (สำหรับ Student Search/Kiosk)
    ปิดบังข้อมูลสำคัญ (Face Vector)
    """
    try:
        student = students_col.find_one(
            {'student_id': student_id}, 
            {'_id': 0, 'face_vector': 0} 
        )
        
        if student:
            return jsonify({"found": True, "data": student}), 200
        else:
            return jsonify({"found": False, "message": "Student not found"}), 404
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route('/api/student/add', methods=['POST'])
def add_student():
    """เพิ่มข้อมูลนักเรียนใหม่"""
    try:
        data = request.get_json()
        student_id = data.get('student_id')
        
        if not student_id:
            return jsonify({"message": "Student ID is required"}), 400

        if students_col.find_one({'student_id': student_id}):
            return jsonify({"message": "Student ID already exists"}), 409
            
        new_student = {
            "student_id": student_id,
            "full_name": data.get('full_name'),
            "class_code": data.get('class_code'),
            "year_level": data.get('year_level'),
            "email": data.get('email', ''), 
            "phone": data.get('phone', ''), 
            "face_vector": [],
            "created_at": datetime.datetime.now()
        }
        students_col.insert_one(new_student)
        print(f"✅ STUDENT ADDED: {student_id}")
        return jsonify({"message": "Student added successfully"}), 201
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": "Server error"}), 500

@app.route('/api/student/update', methods=['PUT'])
def update_student():
    """
    แก้ไขข้อมูลนักเรียน (รวมฟังก์ชัน Admin และ Student Edit)
    รองรับการแก้: full_name, class_code, year_level, email, phone
    """
    try:
        data = request.get_json()
        student_id = data.get('student_id')
        
        if not student_id:
            return jsonify({"message": "Student ID is required"}), 400
        
        # รายชื่อ Field ที่อนุญาตให้แก้ไข
        allowed_fields = ['full_name', 'class_code', 'year_level', 'email', 'phone']
        
        # ดึงเฉพาะข้อมูลที่มีใน allowed_fields และถูกส่งมาใน request
        update_data = {k: data[k] for k in allowed_fields if k in data and data[k] is not None}
        
        if not update_data:
            return jsonify({"message": "No valid fields provided for update"}), 400

        result = students_col.update_one(
            {'student_id': student_id}, 
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({"message": "Student not found"}), 404
            
        print(f"✅ STUDENT UPDATE: {student_id} updated info.")
        return jsonify({"message": "Student updated successfully", "student_id": student_id}), 200
    except Exception as e:
        print(f"Error updating student: {e}")
        return jsonify({"message": "Server error"}), 500

@app.route('/api/student/delete', methods=['DELETE'])
def delete_student():
    """ลบข้อมูลนักเรียนรายคน"""
    try:
        student_id = request.args.get('student_id')
        
        result = students_col.delete_one({'student_id': student_id})
        
        if result.deleted_count == 0:
            return jsonify({"message": "Student not found"}), 404
            
        print(f"🗑️ STUDENT DELETED: {student_id}")
        return jsonify({"message": "Student deleted successfully"}), 200
    except Exception as e:
        return jsonify({"message": "Server error"}), 500

@app.route('/api/student/delete-multiple', methods=['POST'])
def delete_multiple_students():
    """ลบข้อมูลนักเรียนหลายคนพร้อมกัน (Bulk Delete)"""
    try:
        data = request.get_json()
        student_ids = data.get('student_ids', [])

        if not student_ids:
            return jsonify({"message": "No IDs provided"}), 400

        result = students_col.delete_many({'student_id': {'$in': student_ids}})

        print(f"🗑️ BULK DELETE: {result.deleted_count} students deleted.")
        return jsonify({
            "message": f"Successfully deleted {result.deleted_count} students",
            "deleted_count": result.deleted_count
        }), 200

    except Exception as e:
        print(f"Error bulk delete: {e}")
        return jsonify({"message": "Server error"}), 500

# ---------------------------------------------------------------------
# 4. Room & IoT API
# ---------------------------------------------------------------------

@app.route('/api/room/update', methods=['POST'])
def update_room_status():
    """รับคำสั่งจาก Python AI Logic เพื่ออัปเดตสถานะล็อค"""
    data = request.get_json()
    room_id = data.get('room_id')
    new_status = data.get('status')
    
    if not room_id or new_status not in ['LOCK', 'UNLOCK']:
        return jsonify({"message": "Invalid parameters."}), 400
        
    try:
        result = rooms_col.update_one({'room_id': room_id}, {'$set': {'lock_status': new_status}})
        if result.modified_count == 0:
            return jsonify({"message": f"Room {room_id} not found or status already {new_status}."}), 404
        print(f"✅ DB UPDATE: Room {room_id} status changed to {new_status}")
        return jsonify({"message": f"Status updated to {new_status}", "room_id": room_id}), 200
    except Exception as e:
        print(f"Error updating room status: {e}")
        return jsonify({"message": "Server error during DB update."}), 500

@app.route('/api/room/status/<room_id>', methods=['GET'])
def get_room_lock_status(room_id):
    """Arduino/IoT ดึงสถานะล็อค"""
    room = rooms_col.find_one({'room_id': room_id}, {'lock_status': 1, 'room_id': 1})
    if room:
        return jsonify({"room_id": room_id, "lock_status": room['lock_status']}), 200
    else:
        return jsonify({"message": f"Room ID {room_id} not found."}), 404

# ---------------------------------------------------------------------
# 5. Logging API
# ---------------------------------------------------------------------

@app.route('/api/log/access', methods=['POST'])
def log_access_event():
    """บันทึก Log การเข้าถึง"""
    data = request.get_json()
    required_fields = ['user_id', 'user_type', 'room_id', 'status', 'reason']
    if not all(field in data for field in required_fields):
        return jsonify({"message": "Missing required log fields."}), 400

    try:
        log_entry = {
            "user_id": data['user_id'],
            "user_type": data['user_type'],
            "room_id": data['room_id'],
            "status": data['status'],
            "reason": data['reason'],
            "timestamp": datetime.datetime.now()
        }
        result = log_col.insert_one(log_entry)
        print(f"✅ LOG ACCESS: {data['user_id']} ({data['status']}) recorded.")
        return jsonify({"message": "Log recorded successfully", "id": str(result.inserted_id)}), 201
    except Exception as e:
        print(f"Error during logging: {e}")
        return jsonify({"message": "Server error during logging process."}), 500

# ---------------------------------------------------------------------
# Main Entry Point
# ---------------------------------------------------------------------

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)