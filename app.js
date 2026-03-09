/**
 * Javascript logic for School Uniform & Stationery Billing System
 */

// --- STATE MANAGEMENT & MOCK DATA ---
const state = {
    user: null, // { username, role }
    activeSchool: null,
    cart: {}, // { itemId: quantity }
    cartTotal: 0
};

// Mock Uniform Items
const posItems = [
    { id: 1, name: "Shirt", price: 450, img: "ph-t-shirt" },
    { id: 2, name: "Pant", price: 600, img: "ph-pants" },
    { id: 3, name: "Skirt", price: 550, img: "ph-dress" },
    { id: 4, name: "Blazer", price: 1200, img: "ph-coat-hanger" },
    { id: 5, name: "Sports Uniform", price: 850, img: "ph-sneaker-move" },
    { id: 6, name: "Belt", price: 150, img: "ph-arrows-in-line-horizontal" },
    { id: 7, name: "House Shoes", price: 300, img: "ph-sneaker" },
    { id: 8, name: "School Shoes", price: 700, img: "ph-boot" },
    { id: 9, name: "Socks", price: 100, img: "ph-footprints" },
    { id: 10, name: "Tie", price: 150, img: "ph-user-focus" },
    { id: 11, name: "Hair Band", price: 50, img: "ph-bandaids" },
    { id: 12, name: "School Bag", price: 900, img: "ph-backpack" }
];

// Mock Schools (Persisted in LocalStorage)
let schools = JSON.parse(localStorage.getItem('billing_schools')) || [
    { id: 's1', name: 'Unique International School' },
    { id: 's2', name: 'ABC School' },
    { id: 's3', name: 'XYZ School' }
];

// Mock Students (Persisted)
let students = JSON.parse(localStorage.getItem('billing_students')) || [
    { id: 101, sNo: "001", std: "10th A", name: "Amit Sharma", phone: "9876543210", parent: "Rajesh Sharma", address: "Mumbai, MH", house: "Red House", gender: "Male" },
    { id: 102, sNo: "002", std: "8th B", name: "Priya Patel", phone: "8765432109", parent: "Ramesh Patel", address: "Pune, MH", house: "Blue House", gender: "Female" },
    { id: 103, sNo: "003", std: "5th C", name: "Rahul Verma", phone: "7654321098", parent: "Suresh Verma", address: "Nagpur, MH", house: "Green House", gender: "Male" }
];

// Mock Invoices
let invoices = JSON.parse(localStorage.getItem('billing_invoices')) || [
    { id: "1001", studentName: "Amit Sharma", school: "Unique International School", amount: 1500, status: "Paid" },
    { id: "1002", studentName: "Priya Patel", school: "ABC School", amount: 850, status: "Draft" },
    { id: "1003", studentName: "Rahul Verma", school: "Unique International School", amount: 2400, status: "Pending" }
];

// Currently selected student for billing
let activeBillingStudent = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Setup form handlers
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('add-school-form').addEventListener('submit', handleAddSchool);

    // Excel upload styling fix
    document.getElementById('school-excel-file').addEventListener('change', function (e) {
        if (e.target.files.length > 0) {
            document.getElementById('school-file-name').textContent = e.target.files[0].name;
            document.getElementById('school-file-info').classList.remove('hidden');
        }
    });

    document.getElementById('bulk-student-file').addEventListener('change', function (e) {
        if (e.target.files.length > 0) {
            document.getElementById('bulk-file-name').textContent = e.target.files[0].name;
            document.getElementById('bulk-file-display').classList.remove('hidden');
        }
    });

    // Sub-view nav
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const target = el.getAttribute('data-target');
            if (target) switchNav(target);
        });
    });

    // Search students
    document.getElementById('search-student').addEventListener('input', (e) => {
        renderStudentsTable(e.target.value);
    });

    // Search products
    document.getElementById('search-items').addEventListener('input', (e) => {
        renderPOSItems(e.target.value);
    });
    // search inside add-student modal
    const studentSearch = document.getElementById('search-items-student');
    if (studentSearch) {
        studentSearch.addEventListener('input', (e) => {
            renderStudentPOSItems(e.target.value);
        });
    }

    // add-student form submit
    const addStudentForm = document.getElementById('add-student-form');
    if (addStudentForm) {
        addStudentForm.addEventListener('submit', handleAddStudent);
    }
}

// --- UTILS & CORE ---

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').textContent = msg;
    toast.classList.remove('hidden');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}

function showView(viewId) {
    document.querySelectorAll('.view, #app-shell').forEach(el => el.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
}

function openModal(modalId) { document.getElementById(modalId).classList.remove('hidden'); }
function closeModal(modalId) { document.getElementById(modalId).classList.add('hidden'); }

// Generate a random ID
const genId = () => Math.random().toString(36).substr(2, 6).toUpperCase();

// Save Data Helpers
function saveData() {
    localStorage.setItem('billing_schools', JSON.stringify(schools));
    localStorage.setItem('billing_students', JSON.stringify(students));
    localStorage.setItem('billing_invoices', JSON.stringify(invoices));
}

// --- MODULE: AUTHENTICATION ---

function handleLogin(e) {
    e.preventDefault();
    const role = document.getElementById('login-role').value;
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="ph ph-spinner"></i> Logging in...';
    submitBtn.disabled = true;

    // Call backend API
    fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Login successful') {
            // Check if role matches
            if (data.user.role === role) {
                state.user = { 
                    role: data.user.role, 
                    username: data.user.name,
                    email: data.user.email,
                    id: data.user.id
                };
                
                showToast(`Logged in successfully as ${role}`);
                fetchSchools();
                showView('view-school-select');
            } else {
                showToast(`Role mismatch. You are registered as ${data.user.role}`, 'error');
            }
        } else {
            showToast(data.message || 'Login failed', 'error');
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        showToast('Connection error. Please try again.', 'error');
    })
    .finally(() => {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

function logout() {
    state.user = null;
    state.activeSchool = null;
    showView('view-login');
}

// --- REGISTRATION FUNCTIONS ---
function showRegisterModal() {
    openModal('register-modal');
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="ph ph-spinner"></i> Registering...';
    submitBtn.disabled = true;

    // Call backend API
    fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: name,
            email: email,
            password: password,
            role: role
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'User registered successfully') {
            showToast('Registration successful! You can now login.');
            closeModal('register-modal');
            document.getElementById('register-form').reset();
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
    })
    .catch(error => {
        console.error('Registration error:', error);
        showToast('Connection error. Please try again.', 'error');
    })
    .finally(() => {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

// --- MODULE: SCHOOL SELECTION ---

// Fetch schools from backend
function fetchSchools() {
    fetch('http://localhost:5000/schools')
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Schools retrieved successfully') {
                schools = data.data.map(school => ({
                    id: school.id.toString(),
                    name: school.school_name,
                    address: school.address,
                    contact_person: school.contact_person,
                    contact_person_number: school.contact_person_number,
                    academic_year: school.academic_year
                }));
                populateSchoolDropdown();
            }
        })
        .catch(error => {
            console.error('Fetch schools error:', error);
            showToast('Failed to load schools from backend', 'error');
        });
}

function populateSchoolDropdown() {
    const select = document.getElementById('school-dropdown');
    select.innerHTML = '';
    schools.forEach(school => {
        const opt = document.createElement('option');
        opt.value = school.id;
        opt.textContent = school.name;
        select.appendChild(opt);
    });
}

function continueToDashboard() {
    const select = document.getElementById('school-dropdown');
    const selectedId = select.value;

    if (!selectedId) {
        showToast("Please select a school first.");
        return;
    }

    state.activeSchool = schools.find(s => s.id === selectedId);

    // Setup Shell
    document.getElementById('active-school-name').textContent = state.activeSchool.name;
    document.getElementById('active-user-role').textContent = state.user.role === 'admin' ? 'Admin' : 'Worker';

    // Role based visibility
    if (state.user.role === 'worker') {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
    } else {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
    }

    showView('app-shell');
    switchNav('dashboard');
    
    // Fetch students for this school
    fetchStudents();
}

function handleAddSchool(e) {
    e.preventDefault();
    const name = document.getElementById('add-school-name').value;
    const address = document.getElementById('add-school-address').value;
    const contactPerson = document.getElementById('add-school-contact-person').value;
    const phone = document.getElementById('add-school-phone').value;
    const academicYear = document.getElementById('add-school-year').value || "2024-2025";

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="ph ph-spinner"></i> Adding School...';
    submitBtn.disabled = true;

    // Call backend API
    fetch('http://localhost:5000/schools', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            school_name: name,
            address: address,
            contact_person: contactPerson,
            contact_person_number: phone,
            academic_year: academicYear
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'School added successfully') {
            // Refresh schools list
            fetchSchools();
            
            closeModal('add-school-modal');
            showToast("School added successfully");
            document.getElementById('add-school-form').reset();
            document.getElementById('school-file-info').classList.add('hidden');
        } else {
            showToast(data.message || 'Failed to add school', 'error');
        }
    })
    .catch(error => {
        console.error('Add school error:', error);
        showToast('Connection error. Please try again.', 'error');
    })
    .finally(() => {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

// --- MODULE: DASHBOARD NAVIGATION ---

function switchNav(target) {
    // Hide all subviews
    document.querySelectorAll('.subview').forEach(el => el.classList.add('hidden'));
    document.getElementById('subview-' + target).classList.remove('hidden');

    // Update sidebar active state
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
        if (el.getAttribute('data-target') === target) el.classList.add('active');
        else el.classList.remove('active');
    });

    // Pre-render logic based on view
    if (target === 'students-list') renderStudentsTable();
    if (target === 'parents') renderParentsTable();
    if (target === 'invoices') renderInvoicesTable();
    if (target === 'billing') {
        if (!activeBillingStudent) {
            showToast("Please select a student from Students list first.");
            switchNav('students-list');
            return;
        }
        setupBillingView();
    }
}

// --- MODULE: STUDENTS ---

// Fetch students from backend
function fetchStudents() {
    if (!state.activeSchool) {
        console.log('No active school selected');
        return;
    }
    
    fetch(`http://localhost:5000/students/school/${state.activeSchool.id}`)
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data)) {
                students = data.map(student => ({
                    id: student.id,
                    sNo: student.id, // Using ID as roll number for now
                    std: student.std || '',
                    name: student.student_name,
                    phone: student.mobile_no || '',
                    parent: student.parent_name || '',
                    school_id: student.school_id
                }));
                renderStudentsTable();
            }
        })
        .catch(error => {
            console.error('Fetch students error:', error);
            showToast('Failed to load students from backend', 'error');
        });
}

// temporary cart used when adding a student
// structure: { [itemId]: { qty: number, size: string } }
let studentCart = {};

function openAddStudentModal() {
    // reset form and cart
    document.getElementById('add-student-form').reset();
    studentCart = {};
    document.getElementById('search-items-student').value = '';
    renderStudentPOSItems('');
    updateStudentCartUI();
    openModal('add-student-modal');
}

function handleAddStudent(e) {
    e.preventDefault();
    const name = document.getElementById('add-student-name').value.trim();
    const std = document.getElementById('add-student-class').value.trim();
    const parent = document.getElementById('add-student-parent').value.trim();
    const phone = document.getElementById('add-student-parent-phone').value.trim();

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="ph ph-spinner"></i> Adding Student...';
    submitBtn.disabled = true;

    // Call backend API
    fetch('http://localhost:5000/students', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            school_id: state.activeSchool.id,
            student_name: name,
            std: std,
            parent_name: parent,
            mobile_no: phone
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Student added successfully') {
            // if items were selected create an invoice immediately
            if (Object.keys(studentCart).length > 0) {
                let subtotal = 0;
                Object.keys(studentCart).forEach(idStr => {
                    const item = posItems.find(i => i.id === parseInt(idStr));
                    subtotal += item.price * studentCart[idStr];
                });
                const inv = {
                    id: genId(),
                    studentName: name,
                    school: state.activeSchool ? state.activeSchool.name : '',
                    amount: subtotal,
                    status: "Paid"
                };
                invoices.unshift(inv);
                saveData();
                showToast("Student added and invoice generated");
            } else {
                showToast("Student added successfully");
            }

            closeModal('add-student-modal');
            renderStudentsTable();
            fetchStudents(); // Refresh students from backend
        } else {
            showToast(data.message || 'Failed to add student', 'error');
        }
    })
    .catch(error => {
        console.error('Add student error:', error);
        showToast('Connection error. Please try again.', 'error');
    })
    .finally(() => {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

function mockImportStudents() {
    const fileNode = document.getElementById('bulk-student-file');
    if (!fileNode.files.length) {
        alert("Please select an Excel file first!");
        return;
    }
    showToast("Importing students processing...");
    setTimeout(() => {
        const newStudents = [
            { id: Date.now() + 1, sNo: "004", std: "1st A", name: "Ravi Kumar", phone: "9000000001", parent: "Rakesh Kumar", address: "City Center", house: "Red", gender: "Male" },
            { id: Date.now() + 2, sNo: "005", std: "2nd B", name: "Sonia Singh", phone: "9000000002", parent: "Ajay Singh", address: "Viman Nagar", house: "Blue", gender: "Female" }
        ];
        students = [...students, ...newStudents];
        saveData();
        showToast("Student data imported successfully");
        document.getElementById('bulk-student-file').value = "";
        document.getElementById('bulk-file-display').classList.add('hidden');
        switchNav('students-list');
    }, 1000);
}

// Dropdown toggle function
function toggleDropdown(studentId) {
    // Close all other dropdowns
    document.querySelectorAll('.dropdown').forEach(dropdown => {
        if (dropdown.id !== `dropdown-${studentId}`) {
            dropdown.classList.remove('show');
        }
    });
    
    // Toggle current dropdown
    const currentDropdown = document.getElementById(`dropdown-${studentId}`);
    currentDropdown.classList.toggle('show');
}

// Show QR for student
function showStudentQR(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    // Close dropdown
    document.getElementById(`dropdown-${studentId}`).classList.remove('show');
    
    // Set QR modal content
    document.getElementById('qr-student-name').textContent = student.name;
    document.getElementById('qr-student-details').textContent = `Class: ${student.std} | Phone: ${student.phone}`;
    document.getElementById('qr-amount').textContent = '₹0.00';
    
    // Generate QR code with student details
    const qrData = `Student: ${student.name}\nClass: ${student.std}\nPhone: ${student.phone}\nSchool: ${state.activeSchool.name}`;
    generateQRCode(qrData);
    
    openModal('qr-modal');
}

// Generate QR Code (simulated)
function generateQRCode(data) {
    // This is a placeholder for QR code generation
    // In a real application, you would use a QR code library like qrcode.js
    // For now, we'll just show the QR icon
    console.log('QR Data:', data);
    
    // You could integrate with a real QR code library here
    // Example: 
    // QRCode.toCanvas(document.getElementById('qr-canvas'), data, function (error) {
    //   if (error) console.error(error);
    // });
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }
});

function renderStudentsTable(filterText = '') {
    const tbody = document.querySelector('#students-table tbody');
    tbody.innerHTML = '';

    const filtered = students.filter(s =>
        s.name.toLowerCase().includes(filterText.toLowerCase()) ||
        s.std.toLowerCase().includes(filterText.toLowerCase())
    );

    if (filtered.length === 0) {
        document.getElementById('empty-students').classList.remove('hidden');
        document.getElementById('students-table').parentElement.classList.add('hidden');
        return;
    } else {
        document.getElementById('empty-students').classList.add('hidden');
        document.getElementById('students-table').parentElement.classList.remove('hidden');
    }

    filtered.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${s.sNo}</td>
            <td><span class="badge badge-outline">${s.std}</span></td>
            <td class="font-medium">${s.name}</td>
            <td>${s.phone}</td>
            <td class="text-right">
                <div class="dropdown" id="dropdown-${s.id}">
                    <button class="dropdown-toggle" onclick="toggleDropdown('${s.id}')">
                        <i class="ph ph-dots-three"></i>
                    </button>
                    <div class="dropdown-menu">
                        <button class="dropdown-item" onclick="showStudentQR('${s.id}')">
                            <i class="ph ph-qr-code" style="margin-right: 0.5rem;"></i> Show QR
                        </button>
                        <button class="dropdown-item admin-only" onclick="editStudent('${s.id}')">
                            <i class="ph ph-pencil-simple" style="margin-right: 0.5rem;"></i> Edit
                        </button>
                        <button class="dropdown-item" onclick="startBillingForStudent('${s.id}')">
                            <i class="ph ph-receipt" style="margin-right: 0.5rem;"></i> Create Invoice
                        </button>
                    </div>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Hide edit for workers again
    if (state.user && state.user.role === 'worker') {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
    }
}

function startBillingForStudent(studentId) {
    activeBillingStudent = students.find(s => s.id === studentId);
    state.cart = {}; // Reset cart
    switchNav('billing');
}

function editStudent(id) {
    showToast("Edit student placeholder triggered for ID " + id);
}


// --- MODULE: STUDENT + MODAL POS HELPERS ---

function renderStudentPOSItems(filterText = '') {
    const grid = document.getElementById('modal-pos-items-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const filtered = posItems.filter(i => i.name.toLowerCase().includes(filterText.toLowerCase()));
    filtered.forEach(item => {
        const entry = studentCart[item.id] || { qty: 0, size: '' };
        const qty = entry.qty;
        const selectedSize = entry.size || '';
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">
                <i class="ph ${item.img}"></i>
            </div>
            <div class="product-info">
                <div class="product-title">${item.name}</div>
                <!-- price hidden per requirements -->
                <div class="size-select-container mt-2">
                    <select class="size-select" onchange="updateStudentItemSize(${item.id}, this.value)">
                        <option value="">Size</option>
                        <option value="XS">XS</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                    </select>
                </div>
                <div class="qty-controls mt-2">
                    <button class="qty-btn" onclick="updateStudentItemQty(${item.id}, -1)"><i class="ph ph-minus"></i></button>
                    <span class="qty-display">${qty}</span>
                    <button class="qty-btn" onclick="updateStudentItemQty(${item.id}, 1)"><i class="ph ph-plus"></i></button>
                </div>
            </div>
        `;
        // after attaching card, set dropdown value
        grid.appendChild(card);
        if (selectedSize) {
            const sel = card.querySelector('.size-select');
            if (sel) sel.value = selectedSize;
        }
    });
}

function updateStudentItemQty(itemId, change) {
    const entry = studentCart[itemId] || { qty: 0, size: '' };
    const newQty = entry.qty + change;
    if (newQty <= 0) {
        delete studentCart[itemId];
    } else {
        studentCart[itemId] = { qty: newQty, size: entry.size };
    }
    renderStudentPOSItems(document.getElementById('search-items-student').value);
    updateStudentCartUI();
}

function updateStudentItemSize(itemId, size) {
    const entry = studentCart[itemId] || { qty: 0, size: '' };
    studentCart[itemId] = { qty: entry.qty, size };
    updateStudentCartUI();
}

function updateStudentCartUI() {
    const cartList = document.getElementById('modal-cart-items-list');
    cartList.innerHTML = '';
    let subtotal = 0;
    const keys = Object.keys(studentCart);
    if (keys.length === 0) {
        cartList.innerHTML = `
            <div class="empty-cart text-center text-muted p-4">
                <i class="ph ph-shopping-cart" style="font-size: 2rem;"></i>
                <p>No items selected yet.</p>
            </div>
        `;
    } else {
        keys.forEach(itemIdStr => {
            const itemId = parseInt(itemIdStr);
            const item = posItems.find(i => i.id === itemId);
            const entry = studentCart[itemId];
            const qty = entry.qty;
            const size = entry.size;
            const lineTotal = item.price * qty;
            subtotal += lineTotal;
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}${size ? ' (' + size + ')' : ''}</div>
                    <div class="cart-item-meta">₹${item.price} × ${qty}</div>
                </div>
                <div class="cart-item-price">₹${lineTotal.toFixed(2)}</div>
            `;
            cartList.appendChild(div);
        });
    }
    document.getElementById('modal-bill-subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('modal-bill-total').textContent = subtotal.toFixed(2);
}


function renderParentsTable() {
    const tbody = document.querySelector('#parents-table tbody');
    tbody.innerHTML = '';
    students.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="font-medium">${s.name}</td>
            <td>${s.parent}</td>
            <td>${s.phone}</td>
            <td>${s.address}</td>
            <td class="text-right">
                <button class="btn btn-icon-small" title="Edit Parent"><i class="ph ph-pencil-simple"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- MODULE: POS BILLING ---

function setupBillingView() {
    // Populate Student Info
    document.getElementById('bill-student-name').textContent = activeBillingStudent.name;
    document.getElementById('bill-student-std').textContent = "Std " + activeBillingStudent.std;
    document.getElementById('bill-parent-name').textContent = activeBillingStudent.parent;
    document.getElementById('bill-student-phone').textContent = activeBillingStudent.phone;
    document.getElementById('bill-student-house').textContent = activeBillingStudent.house;

    document.getElementById('search-items').value = '';
    renderPOSItems('');
    updateCartUI();
}

function renderPOSItems(filterText = '') {
    const grid = document.getElementById('pos-items-grid');
    grid.innerHTML = '';

    const filtered = posItems.filter(i => i.name.toLowerCase().includes(filterText.toLowerCase()));

    filtered.forEach(item => {
        const qty = state.cart[item.id] || 0;

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">
                <i class="ph ${item.img}"></i>
            </div>
            <div class="product-info">
                <div class="product-title">${item.name}</div>
                <div class="product-price">₹${item.price}</div>
                
                <div class="qty-controls mt-2">
                    <button class="qty-btn" onclick="updateItemQty(${item.id}, -1)"><i class="ph ph-minus"></i></button>
                    <span class="qty-display">${qty}</span>
                    <button class="qty-btn" onclick="updateItemQty(${item.id}, 1)"><i class="ph ph-plus"></i></button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function updateItemQty(itemId, change) {
    const currentQty = state.cart[itemId] || 0;
    const newQty = currentQty + change;

    if (newQty <= 0) {
        delete state.cart[itemId];
    } else {
        state.cart[itemId] = newQty;
    }

    // Re-render just that item's display if we wanted to be optimal, but let's re-render all for simplicity
    renderPOSItems(document.getElementById('search-items').value);
    updateCartUI();
}

function updateCartUI() {
    const cartList = document.getElementById('cart-items-list');
    cartList.innerHTML = '';

    let subtotal = 0;

    const cartKeys = Object.keys(state.cart);

    if (cartKeys.length === 0) {
        cartList.innerHTML = `
            <div class="empty-cart text-center text-muted p-4">
                <i class="ph ph-shopping-cart" style="font-size: 2rem;"></i>
                <p>No items selected yet.</p>
            </div>
        `;
    } else {
        cartKeys.forEach(itemIdStr => {
            const itemId = parseInt(itemIdStr);
            const item = posItems.find(i => i.id === itemId);
            const qty = state.cart[itemId];
            const lineTotal = item.price * qty;
            subtotal += lineTotal;

            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-meta">₹${item.price} × ${qty}</div>
                </div>
                <div class="cart-item-price">₹${lineTotal.toFixed(2)}</div>
            `;
            cartList.appendChild(div);
        });
    }

    state.cartTotal = subtotal;

    document.getElementById('bill-subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('bill-total').textContent = subtotal.toFixed(2);
}

// --- MODULE: INVOICES ---

function saveAsDraft() {
    if (Object.keys(state.cart).length === 0) {
        showToast("Cannot save empty draft.");
        return;
    }
    const id = genId();
    const inv = {
        id: id,
        studentName: activeBillingStudent.name,
        school: state.activeSchool.name,
        amount: state.cartTotal,
        status: "Draft"
    };
    invoices.unshift(inv);
    saveData();
    showToast("Invoice saved as Draft successfully.");
    showPaperBill(id, 'Draft');
}

function generateInvoice() {
    if (Object.keys(state.cart).length === 0) {
        showToast("Cannot generate empty bill.");
        return;
    }

    const id = genId();
    const inv = {
        id: id,
        studentName: activeBillingStudent.name,
        school: state.activeSchool.name,
        amount: state.cartTotal,
        status: "Paid"
    };
    invoices.unshift(inv);
    saveData();
    showPaperBill(id, 'Paid');
}

function showPaperBill(invoiceId, status) {
    // Fill header info
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    document.getElementById('pb-invoice-id').textContent = 'INV-' + invoiceId;
    document.getElementById('pb-date').textContent = dateStr;
    document.getElementById('pb-time').textContent = timeStr;
    document.getElementById('pb-student-name').textContent = activeBillingStudent.name;
    document.getElementById('pb-student-std').textContent = activeBillingStudent.std;
    document.getElementById('pb-student-roll').textContent = activeBillingStudent.sNo || '—';
    document.getElementById('pb-school-name').textContent = state.activeSchool.name;
    document.getElementById('pb-phone').textContent = activeBillingStudent.phone;
    document.getElementById('pb-barcode-label').textContent = 'INV-' + invoiceId;

    // Fill items
    const tbody = document.getElementById('pb-items-body');
    tbody.innerHTML = '';
    let subtotal = 0;
    let sNo = 1;
    Object.keys(state.cart).forEach(itemIdStr => {
        const itemId = parseInt(itemIdStr);
        const item = posItems.find(i => i.id === itemId);
        const qty = state.cart[itemId];
        const lineTotal = item.price * qty;
        subtotal += lineTotal;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align:center">${sNo}</td>
            <td>${item.name}</td>
            <td style="text-align:center">${qty}</td>
            <td style="text-align:right">₹${item.price}</td>
            <td style="text-align:right">₹${lineTotal.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
        sNo++;
    });

    // Calculate GST
    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const grandTotal = subtotal + cgst + sgst;

    document.getElementById('pb-subtotal').textContent = '₹' + subtotal.toFixed(2);
    document.getElementById('pb-cgst').textContent = '₹' + cgst.toFixed(2);
    document.getElementById('pb-sgst').textContent = '₹' + sgst.toFixed(2);
    document.getElementById('pb-total').textContent = '₹' + grandTotal.toFixed(2);

    // Convert amount to words
    document.getElementById('pb-amount-words').textContent = numberToWords(grandTotal) + ' Only';

    // Status stamp
    const stamp = document.getElementById('pb-status-stamp');
    stamp.textContent = status.toUpperCase();
    stamp.className = 'paper-bill-status-stamp' + (status === 'Paid' ? ' paid' : '');

    openModal('bill-draft-modal');
}

// Function to convert number to words
function numberToWords(num) {
    const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    
    if ((num = num.toString()).length > 9) return 'overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return; 
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + '' : '';
    return 'Rupees ' + str;
}

function showQR() {
    if (state.cartTotal <= 0) {
        showToast("Add items to generate QR");
        return;
    }
    document.getElementById('qr-amount').textContent = '₹' + state.cartTotal.toFixed(2);
    openModal('qr-modal');
}

function markPaid() {
    closeModal('qr-modal');
    generateInvoice();
}

function renderInvoicesTable() {
    const tbody = document.querySelector('#invoices-table tbody');
    tbody.innerHTML = '';

    invoices.forEach(inv => {
        let statusBadge = '';
        if (inv.status === 'Draft') statusBadge = 'badge-outline';
        else if (inv.status === 'Paid') statusBadge = 'badge-success';
        else statusBadge = 'badge-warning';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="font-medium">#INV-${inv.id}</td>
            <td>${inv.studentName}</td>
            <td>${inv.school}</td>
            <td class="font-bold text-primary">₹${inv.amount.toFixed(2)}</td>
            <td><span class="badge ${statusBadge}">${inv.status}</span></td>
            <td class="text-right">
                <button class="btn btn-icon-small" title="View"><i class="ph ph-eye"></i></button>
                <button class="btn btn-icon-small" title="Print/Download PDF"><i class="ph ph-download-simple"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
