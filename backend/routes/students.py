from flask import Blueprint, request, jsonify
from supabase_client import supabase

students_routes = Blueprint("students_routes", __name__)

# Add Student
@students_routes.route("/students", methods=["POST"])
def add_student():

    data = request.json

    response = supabase.table("students").insert({
        "school_id": data["school_id"],
        "student_name": data["student_name"],
        "std": data.get("std"),
        "parent_name": data.get("parent_name"),
        "mobile_no": data.get("mobile_no"),
    }).execute()

    return jsonify({
        "message": "Student added successfully",
        "data": response.data
    })


# Bulk Add Students
@students_routes.route("/students/bulk", methods=["POST"])
def bulk_add_students():
    data = request.json
    try:
        response = supabase.table("students").insert(data["students"]).execute()
        return jsonify({
            "message": f"{len(data['students'])} Students imported successfully",
            "data": response.data
        })
    except Exception as e:
        return jsonify({
            "message": "Failed to import students",
            "error": str(e)
        }), 400


# Get All Students
@students_routes.route("/students", methods=["GET"])
def get_students():

    response = supabase.table("students").select("*").execute()

    return jsonify(response.data)


# Get Students by School
@students_routes.route("/students/school/<school_id>", methods=["GET"])
def get_students_by_school(school_id):

    response = supabase.table("students") \
        .select("*") \
        .eq("school_id", school_id) \
        .execute()

    return jsonify(response.data)


# Update Student
@students_routes.route("/students/<id>", methods=["PUT"])
def update_student(id):

    data = request.json

    response = supabase.table("students") \
        .update(data) \
        .eq("id", id) \
        .execute()

    return jsonify({
        "message": "Student updated successfully",
        "data": response.data
    })


# Delete Student
@students_routes.route("/students/<id>", methods=["DELETE"])
def delete_student(id):

    supabase.table("students") \
        .delete() \
        .eq("id", id) \
        .execute()

    return jsonify({
        "message": "Student deleted successfully"
    })