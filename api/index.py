from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson.objectid import ObjectId
import os
import datetime
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

# Load environment variables from .env
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

    # Declare all Collections
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
    """Register a new admin user"""
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
    """Login (Check against Database only)"""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"message": "Email and Password are required"}), 400

    # 1. Find User in Database
    user = users_col.find_one({"email": email})

    # 2. Check password (using check_password_hash)
    if user and check_password_hash(user['password'], password):
        return jsonify({
            "message": "Login successful",
            "user": {
                "email": user['email'],
                "full_name": user.get('full_name', 'User')
            }
        }), 200
    else:
        # If not found or wrong password
        return jsonify({"message": "Invalid email or password"}), 401


@app.route('/api/auth/update-password', methods=['PUT'])
def update_password():
    """Change password (Reset Password)"""
    data = request.get_json()
    email = data.get('email')
    new_password = data.get('password')

    if not email or not new_password:
        return jsonify({"message": "Email and New Password are required"}), 400

    # Hash the new password
    hashed_password = generate_password_hash(new_password)

    result = users_col.update_one(
        {"email": email},
        {"$set": {"password": hashed_password}}
    )

    if result.matched_count == 0:
        return jsonify({"message": "User email not found"}), 404

    return jsonify({"message": "Password updated successfully"}), 200


# ---------------------------------------------------------------------
# 2. Staff / Teacher API (Manage Staff Data)
# ---------------------------------------------------------------------

@app.route('/api/teacher/status', methods=['GET'])
def get_teacher_status():
    """Get all teachers and room statuses for Dashboard"""
    try:
        teachers = list(staff_col.find({}, {'face_encoding': 0, 'face_vector': 0}))
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
    """Add new staff data"""
    try:
        data = request.get_json()
        staff_id = data.get('staff_id')

        if not staff_id:
             return jsonify({"message": "Staff ID is required"}), 400

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
    """Edit staff data"""
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
        # Filter only fields that have values sent
        update_data = {k: v for k, v in update_data.items() if v is not None}

        if not update_data:
             return jsonify({"message": "No valid fields provided for update"}), 400

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

@app.route('/api/staff/delete', methods=['DELETE'])
def delete_staff():
    """Delete single staff member"""
    try:
        staff_id = request.args.get('staff_id')

        if not staff_id:
             return jsonify({"message": "Staff ID is required"}), 400

        result = staff_col.delete_one({'staff_id': staff_id})

        if result.deleted_count == 0:
            return jsonify({"message": "Staff not found"}), 404

        print(f"🗑️ STAFF DELETED: {staff_id}")
        return jsonify({"message": "Staff deleted successfully"}), 200
    except Exception as e:
        return jsonify({"message": "Server error"}), 500

@app.route('/api/staff/delete-multiple', methods=['POST'])
def delete_multiple_staff():
    """Delete multiple staff members (Bulk Delete)"""
    try:
        data = request.get_json()
        staff_ids = data.get('staff_ids', [])

        if not staff_ids:
            return jsonify({"message": "No IDs provided"}), 400

        result = staff_col.delete_many({'staff_id': {'$in': staff_ids}})

        print(f"🗑️ BULK DELETE STAFF: {result.deleted_count} staff deleted.")
        return jsonify({
            "message": f"Successfully deleted {result.deleted_count} staff",
            "deleted_count": result.deleted_count
        }), 200

    except Exception as e:
        print(f"Error bulk delete staff: {e}")
        return jsonify({"message": "Server error"}), 500

# ---------------------------------------------------------------------
# 3. Student API (Manage Student Data - Admin and Student Service)
# ---------------------------------------------------------------------

@app.route('/api/students', methods=['GET'])
def get_all_students():
    """Get all student data (for Admin List)"""
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
    Find individual student data (for Student Search/Kiosk)
    Hide sensitive data (Face Vector)
    """
    try:
        if not student_id:
             return jsonify({"message": "Student ID is required"}), 400

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
    """Add new student data"""
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
            "email": data.get('email', ''),  # Add field support
            "phone": data.get('phone', ''),  # Add field support
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
    Edit student data (Includes Admin and Student Edit functions)
    Supports editing: full_name, class_code, year_level, email, phone
    """
    try:
        data = request.get_json()
        student_id = data.get('student_id')

        if not student_id:
            return jsonify({"message": "Student ID is required"}), 400

        # List of fields allowed to be edited
        allowed_fields = ['full_name', 'class_code', 'year_level', 'email', 'phone']

        # Extract only data present in allowed_fields and sent in request
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
    """Delete individual student data"""
    try:
        student_id = request.args.get('student_id')

        if not student_id:
             return jsonify({"message": "Student ID is required"}), 400

        result = students_col.delete_one({'student_id': student_id})

        if result.deleted_count == 0:
            return jsonify({"message": "Student not found"}), 404

        print(f"🗑️ STUDENT DELETED: {student_id}")
        return jsonify({"message": "Student deleted successfully"}), 200
    except Exception as e:
        return jsonify({"message": "Server error"}), 500

@app.route('/api/student/delete-multiple', methods=['POST'])
def delete_multiple_students():
    """Delete multiple students simultaneously (Bulk Delete)"""
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
def update_room_status_iot():
    """Receive command from Python AI Logic to update lock status"""
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
def get_room_lock_status_iot(room_id):
    """Arduino/IoT Get Lock Status"""
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
    """Record Access Log"""
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