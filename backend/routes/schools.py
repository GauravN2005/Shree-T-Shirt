from flask import Blueprint, request, jsonify
from supabase_client import supabase

school_routes = Blueprint("school_routes", __name__)

@school_routes.route("/schools", methods=["GET"])
def get_schools():
    response = supabase.table("schools").select("*").execute()
    return jsonify({
        "message": "Schools retrieved successfully",
        "data": response.data
    })

@school_routes.route("/schools", methods=["POST"])
def add_school():

    data = request.json

    school_name = data.get("school_name")
    address = data.get("address")
    contact_person = data.get("contact_person")
    contact_person_number = data.get("contact_person_number")
    academic_year = data.get("academic_year", "2024-2025")  # Default value

    response = supabase.table("schools").insert({
        "school_name": school_name,
        "address": address,
        "contact_person": contact_person,
        "contact_person_number": contact_person_number,
        "academic_year": academic_year
    }).execute()

    return jsonify({
        "message": "School added successfully",
        "data": response.data
    })