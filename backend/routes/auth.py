from flask import Blueprint, request, jsonify
from supabase_client import supabase

auth_routes = Blueprint("auth_routes", __name__)

# Register User
@auth_routes.route("/register", methods=["POST"])
def register():

    data = request.json

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    # check if user already exists
    existing = supabase.table("users").select("*").eq("email", email).execute()

    if existing.data:
        return jsonify({"message": "User already exists"}), 400

    # insert user
    supabase.table("users").insert({
        "name": name,
        "email": email,
        "password": password,
        "role": role
    }).execute()

    return jsonify({"message": "User registered successfully"})

# Login User
@auth_routes.route("/login", methods=["POST"])
def login():
    
    data = request.json
    
    email = data.get("email")
    password = data.get("password")
    
    # check if user exists
    user = supabase.table("users").select("*").eq("email", email).eq("password", password).execute()
    
    if not user.data:
        return jsonify({"message": "Invalid credentials"}), 401
    
    return jsonify({
        "message": "Login successful",
        "user": user.data[0]
    })