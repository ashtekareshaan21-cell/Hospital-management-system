// Admin Portal - Patient & Appointment Management

document.addEventListener('DOMContentLoaded', function() {
    const currentUser = hospital.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    initializeEventListeners();
    displayAllPatients();
    displayAppointmentRequests();
    displayScheduledAppointments();
});

function initializeEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Form submission
    document.getElementById('registrationForm').addEventListener('submit', handlePatientRegistration);

    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', searchPatients);
    document.getElementById('resetBtn').addEventListener('click', resetSearch);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchPatients();
    });

    // Request filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            displayAppointmentRequests(this.getAttribute('data-filter'));
        });
    });

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Modal close buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Delete patient button
    document.getElementById('deletePatientBtn').addEventListener('click', deletePatient);

    // Approve/Reject request buttons
    if (document.getElementById('approveRequestBtn')) {
        document.getElementById('approveRequestBtn').addEventListener('click', approveRequest);
    }
    if (document.getElementById('rejectRequestBtn')) {
        document.getElementById('rejectRequestBtn').addEventListener('click', rejectRequest);
    }

    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

    // Deactivate all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    // Show selected tab
    document.getElementById(tabName).classList.add('active');

    // Activate selected button
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Load data when switching to specific tabs
    if (tabName === 'view') {
        displayAllPatients();
    } else if (tabName === 'requests') {
        displayAppointmentRequests();
    } else if (tabName === 'scheduled') {
        displayScheduledAppointments();
    }
}

function handlePatientRegistration(e) {
    e.preventDefault();

    const formData = {
        fullName: document.getElementById('fullName').value,
        age: document.getElementById('age').value,
        gender: document.getElementById('gender').value,
        bloodGroup: document.getElementById('bloodGroup').value,
        email: document.getElementById('email').value,
        mobileNumber: document.getElementById('mobileNumber').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        zipCode: document.getElementById('zipCode').value,
        medicalHistory: document.getElementById('medicalHistory').value,
        allergies: document.getElementById('allergies').value,
        emergencyContact: document.getElementById('emergencyContact').value,
        emergencyPhone: document.getElementById('emergencyPhone').value
    };

    const result = hospital.registerPatient(formData);
    const messageDiv = document.getElementById('registerMessage');

    if (result.success) {
        messageDiv.classList.remove('error');
        messageDiv.classList.add('success');
        messageDiv.textContent = result.message + ' (Patient ID: ' + result.patientId + ')';
        
        // Reset form
        document.getElementById('registrationForm').reset();
        
        // Clear message after 4 seconds
        setTimeout(() => {
            messageDiv.classList.remove('success');
            messageDiv.textContent = '';
        }, 4000);
    } else {
        messageDiv.classList.remove('success');
        messageDiv.classList.add('error');
        messageDiv.textContent = result.message;
        
        setTimeout(() => {
            messageDiv.classList.remove('error');
            messageDiv.textContent = '';
        }, 4000);
    }
}

function displayAllPatients() {
    const patients = hospital.getAllPatients();
    displayPatientsInTable(patients);
}

function displayPatientsInTable(patients) {
    const patientsList = document.getElementById('patientsList');
    
    if (patients.length === 0) {
        patientsList.innerHTML = '<tr><td colspan="9" class="no-data">No patients registered yet</td></tr>';
        return;
    }

    patientsList.innerHTML = patients.map(patient => `
        <tr onclick="viewPatientDetails('${patient.patientUserId}')">
            <td>${patient.patientUserId}</td>
            <td>${patient.name}</td>
            <td>${patient.email}</td>
            <td>${patient.mobileNumber}</td>
            <td>${patient.age}</td>
            <td>${patient.bloodGroup}</td>
            <td>${patient.city}</td>
            <td>${patient.state}</td>
            <td><span class="status-active">Active</span></td>
        </tr>
    `).join('');
}

function searchPatients() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        displayAllPatients();
        return;
    }

    const allPatients = hospital.getAllPatients();
    const filtered = allPatients.filter(patient => 
        patient.name.toLowerCase().includes(searchTerm) ||
        patient.patientUserId.toLowerCase().includes(searchTerm)
    );

    displayPatientsInTable(filtered);
}

function resetSearch() {
    document.getElementById('searchInput').value = '';
    displayAllPatients();
}

function viewPatientDetails(patientUserId) {
    const patients = hospital.getAllPatients();
    const patient = patients.find(p => p.patientUserId === patientUserId);
    
    if (!patient) {
        alert('Patient not found');
        return;
    }

    const detailsDiv = document.getElementById('patientDetails');
    detailsDiv.innerHTML = `
        <div class="detail-item">
            <span class="label">Patient ID:</span>
            <span class="value">${patient.patientUserId}</span>
        </div>
        <div class="detail-item">
            <span class="label">Full Name:</span>
            <span class="value">${patient.name}</span>
        </div>
        <div class="detail-item">
            <span class="label">Email:</span>
            <span class="value">${patient.email}</span>
        </div>
        <div class="detail-item">
            <span class="label">Mobile Number:</span>
            <span class="value">${patient.mobileNumber}</span>
        </div>
        <div class="detail-item">
            <span class="label">Age:</span>
            <span class="value">${patient.age} years</span>
        </div>
        <div class="detail-item">
            <span class="label">Gender:</span>
            <span class="value">${patient.gender}</span>
        </div>
        <div class="detail-item">
            <span class="label">Blood Group:</span>
            <span class="value">${patient.bloodGroup}</span>
        </div>
        <div class="detail-item">
            <span class="label">Address:</span>
            <span class="value">${patient.address}, ${patient.city}, ${patient.state} ${patient.zipCode}</span>
        </div>
        ${patient.medicalConditions ? `
        <div class="detail-item">
            <span class="label">Medical Conditions:</span>
            <span class="value">${patient.medicalConditions}</span>
        </div>
        ` : ''}
        ${patient.allergies ? `
        <div class="detail-item">
            <span class="label">Allergies:</span>
            <span class="value">${patient.allergies}</span>
        </div>
        ` : ''}
        <div class="detail-item">
            <span class="label">Emergency Contact:</span>
            <span class="value">${patient.emergencyContact} - ${patient.emergencyPhone}</span>
        </div>
    `;

    // Store current patient ID for delete operation
    document.getElementById('patientModal').dataset.currentPatientId = patientUserId;

    // Show modal
    document.getElementById('patientModal').style.display = 'block';
}

function deletePatient() {
    const patientId = document.getElementById('patientModal').dataset.currentPatientId;
    
    if (!patientId) {
        alert('Error: Patient ID not found');
        return;
    }

    if (confirm('Are you sure you want to delete this patient record? This action cannot be undone.')) {
        const result = hospital.deletePatient(patientId);
        
        if (result.success) {
            alert(result.message);
            document.getElementById('patientModal').style.display = 'none';
            displayAllPatients();
        } else {
            alert(result.message);
        }
    }
}

// ===== APPOINTMENT MANAGEMENT =====
function displayAppointmentRequests(filter = 'all') {
    const requests = hospital.getAllAppointmentRequests();
    const container = document.getElementById('appointmentRequests');

    let filtered = requests;
    if (filter !== 'all') {
        filtered = requests.filter(req => req.status.toLowerCase() === filter);
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div class="no-requests">No ${filter !== 'all' ? filter : ''} requests</div>`;
        return;
    }

    container.innerHTML = filtered.map(req => `
        <div class="request-item" onclick="viewRequestDetails('${req.requestId}')">
            <div class="request-header">
                <h3>${req.patientName}</h3>
                <span class="status-badge status-${req.status.toLowerCase()}">${req.status}</span>
            </div>
            <div class="request-info">
                <div class="info-item">
                    <span class="label">Doctor:</span>
                    <span class="value">${req.doctorName}</span>
                </div>
                <div class="info-item">
                    <span class="label">Reason:</span>
                    <span class="value">${req.reason.substring(0, 40)}...</span>
                </div>
                <div class="info-item">
                    <span class="label">Requested:</span>
                    <span class="value">${req.requestDate}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function viewRequestDetails(requestId) {
    const requests = hospital.getAllAppointmentRequests();
    const request = requests.find(r => r.requestId === requestId);

    if (!request) return;

    const detailsDiv = document.getElementById('requestDetails');
    detailsDiv.innerHTML = `
        <div class="detail-item">
            <span class="label">Patient Name:</span>
            <span class="value">${request.patientName}</span>
        </div>
        <div class="detail-item">
            <span class="label">Patient Email:</span>
            <span class="value">${request.patientEmail}</span>
        </div>
        <div class="detail-item">
            <span class="label">Doctor:</span>
            <span class="value">${request.doctorName}</span>
        </div>
        <div class="detail-item">
            <span class="label">Status:</span>
            <span class="value"><strong>${request.status}</strong></span>
        </div>
        <div class="detail-item">
            <span class="label">Reason for Visit:</span>
            <span class="value">${request.reason}</span>
        </div>
        <div class="detail-item">
            <span class="label">Preferred Dates:</span>
            <span class="value">${request.preferredDates.join(', ')}</span>
        </div>
        <div class="detail-item">
            <span class="label">Preferred Times:</span>
            <span class="value">${request.preferredTimes.join(', ')}</span>
        </div>
        ${request.notes ? `
        <div class="detail-item">
            <span class="label">Additional Notes:</span>
            <span class="value">${request.notes}</span>
        </div>
        ` : ''}
        <div class="detail-item">
            <span class="label">Requested on:</span>
            <span class="value">${request.requestDate} at ${request.requestTime}</span>
        </div>
    `;

    // Store request ID in modal
    document.getElementById('requestModal').dataset.currentRequestId = requestId;

    // Show/hide action buttons based on status
    const approveBtn = document.getElementById('approveRequestBtn');
    const rejectBtn = document.getElementById('rejectRequestBtn');
    
    if (request.status === 'Pending') {
        approveBtn.style.display = 'inline-block';
        rejectBtn.style.display = 'inline-block';
    } else {
        approveBtn.style.display = 'none';
        rejectBtn.style.display = 'none';
    }

    document.getElementById('requestModal').style.display = 'block';
}

function displayScheduledAppointments() {
    const appointments = hospital.getAllApprovedAppointments();
    const container = document.getElementById('scheduledAppointments');

    if (appointments.length === 0) {
        container.innerHTML = '<div class="no-appointments">No scheduled appointments</div>';
        return;
    }

    // Sort by date
    appointments.sort((a, b) => {
        const dateA = new Date(a.appointmentDate);
        const dateB = new Date(b.appointmentDate);
        return dateA - dateB;
    });

    container.innerHTML = appointments.map(apt => `
        <div class="appointment-item">
            <div class="appointment-header">
                <h3>${apt.patientName}</h3>
                <span class="status-badge status-${apt.status.toLowerCase()}">${apt.status}</span>
            </div>
            <div class="appointment-info">
                <div class="info-item">
                    <span class="label">Doctor:</span>
                    <span class="value">${apt.doctorName}</span>
                </div>
                <div class="info-item">
                    <span class="label">Date & Time:</span>
                    <span class="value">${apt.appointmentDate} at ${apt.appointmentTime}</span>
                </div>
                <div class="info-item">
                    <span class="label">Reason:</span>
                    <span class="value">${apt.reason}</span>
                </div>
                ${apt.status === 'Completed' ? `
                <div class="info-item">
                    <span class="label">Completed:</span>
                    <span class="value">${apt.completionDate}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        hospital.logout();
        window.location.href = 'login.html';
    }
}

// ===== APPROVAL/REJECTION FUNCTIONS =====
function approveRequest() {
    const requestId = document.getElementById('requestModal').dataset.currentRequestId;
    
    if (!requestId) {
        alert('Error: Request ID not found');
        return;
    }

    // Get the request details
    const requests = hospital.getAllAppointmentRequests();
    const request = requests.find(r => r.requestId === requestId);

    if (!request) {
        alert('Request not found');
        return;
    }

    // Create approval confirmation dialog
    const adminNotes = prompt('Enter admin notes (optional):', '');
    
    if (adminNotes === null) return; // User cancelled

    // Approve the request
    const result = hospital.approveAppointmentRequest(requestId, adminNotes);

    if (result.success) {
        alert('Request approved successfully!');
        document.getElementById('requestModal').style.display = 'none';
        displayAppointmentRequests(); // Refresh the list
    } else {
        alert('Error: ' + result.message);
    }
}

function rejectRequest() {
    const requestId = document.getElementById('requestModal').dataset.currentRequestId;
    
    if (!requestId) {
        alert('Error: Request ID not found');
        return;
    }

    // Get rejection reason
    const reason = prompt('Enter reason for rejection:', '');
    
    if (reason === null || reason.trim() === '') {
        alert('Please provide a reason for rejection');
        return;
    }

    // Reject the request
    const result = hospital.rejectAppointmentRequest(requestId, reason);

    if (result.success) {
        alert('Request rejected successfully!');
        document.getElementById('requestModal').style.display = 'none';
        displayAppointmentRequests(); // Refresh the list
    } else {
        alert('Error: ' + result.message);
    }
}
