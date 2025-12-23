// Doctor Portal - Appointment Request & Availability Management

document.addEventListener('DOMContentLoaded', function() {
    const currentUser = hospital.getCurrentUser();
    if (!currentUser || currentUser.role !== 'doctor') {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('doctorName').textContent = currentUser.name;
    document.getElementById('specialization').textContent = 'Specialization: ' + currentUser.specialization;

    initializeEventListeners();
    loadAvailabilitySlots();
    displayAppointmentRequests();
    displayApprovedSchedule();
});

function initializeEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Availability form
    document.getElementById('availabilityForm').addEventListener('submit', handleAddAvailability);

    // Request filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            displayAppointmentRequests(this.getAttribute('data-filter'));
        });
    });

    // Patient search
    document.getElementById('searchPatientBtn').addEventListener('click', searchPatients);
    document.getElementById('patientSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchPatients();
    });

    document.getElementById('showAllCheckbox').addEventListener('change', function() {
        if (this.checked) {
            displayAllPatients();
        } else {
            clearPatientsDisplay();
        }
    });

    // Fetch patient by ID
    if (document.getElementById('fetchPatientBtn')) {
        document.getElementById('fetchPatientBtn').addEventListener('click', fetchPatientById);
        document.getElementById('patientIdInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') fetchPatientById();
        });
    }

    // Logout
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

    // Request modal buttons
    document.getElementById('approveRequestBtn').addEventListener('click', showApprovalForm);
    document.getElementById('rejectRequestBtn').addEventListener('click', rejectRequest);
    document.getElementById('confirmApprovalBtn').addEventListener('click', confirmApproval);

    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    if (tabName === 'requests') displayAppointmentRequests();
    if (tabName === 'schedule') displayApprovedSchedule();
}

// ===== AVAILABILITY MANAGEMENT =====
function handleAddAvailability(e) {
    e.preventDefault();

    const currentUser = hospital.getCurrentUser();
    const date = document.getElementById('availDate').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const slotsPerHour = document.getElementById('slotsPerHour').value;

    // Validate times
    if (startTime >= endTime) {
        showMessage('availMessage', 'End time must be after start time', false);
        return;
    }

    const availabilityData = {
        date: date,
        startTime: startTime,
        endTime: endTime,
        slotsPerHour: parseInt(slotsPerHour),
        maxCapacity: Math.floor((new Date(`2000-01-01T${endTime}`) - new Date(`2000-01-01T${startTime}`)) / (60 * 1000)) / (60 / slotsPerHour),
        bookedSlots: 0
    };

    const result = hospital.addDoctorAvailability(currentUser.username, availabilityData);

    if (result.success) {
        showMessage('availMessage', 'Availability slot added successfully', true);
        document.getElementById('availabilityForm').reset();
        loadAvailabilitySlots();

        setTimeout(() => {
            document.getElementById('availMessage').classList.remove('success');
        }, 3000);
    } else {
        showMessage('availMessage', 'Error adding availability', false);
    }
}

function loadAvailabilitySlots() {
    const currentUser = hospital.getCurrentUser();
    const slots = hospital.getDoctorAvailability(currentUser.username);
    const container = document.getElementById('availabilitySlots');

    if (slots.length === 0) {
        container.innerHTML = '<div class="no-slots">No available slots added yet</div>';
        return;
    }

    container.innerHTML = slots.map(slot => `
        <div class="slot-card">
            <div class="slot-header">
                <span class="slot-date">${slot.date}</span>
                <button class="btn-remove-slot" onclick="removeSlot('${slot.slotId}')">Remove</button>
            </div>
            <div class="slot-info">
                <div class="slot-info-item">
                    <span class="label">Time:</span>
                    <span class="value">${slot.startTime} - ${slot.endTime}</span>
                </div>
                <div class="slot-info-item">
                    <span class="label">Capacity:</span>
                    <span class="value">${slot.maxCapacity} appointments (${slot.slotsPerHour} per hour)</span>
                </div>
                <div class="slot-info-item">
                    <span class="label">Booked:</span>
                    <span class="value">${slot.bookedSlots} / ${slot.maxCapacity}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function removeSlot(slotId) {
    if (confirm('Are you sure you want to remove this availability slot?')) {
        const result = hospital.removeAvailabilitySlot(slotId);
        if (result.success) {
            alert('Slot removed successfully');
            loadAvailabilitySlots();
        }
    }
}

// ===== APPOINTMENT REQUESTS =====
function displayAppointmentRequests(filter = 'all') {
    const currentUser = hospital.getCurrentUser();
    const requests = hospital.getDoctorAppointmentRequests(currentUser.username);
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
                    <span class="label">Email:</span>
                    <span class="value">${req.patientEmail}</span>
                </div>
                <div class="info-item">
                    <span class="label">Reason:</span>
                    <span class="value">${req.reason.substring(0, 50)}...</span>
                </div>
                <div class="info-item">
                    <span class="label">Preferred Dates:</span>
                    <span class="value">${req.preferredDates.length} date(s)</span>
                </div>
            </div>
        </div>
    `).join('');
}

function viewRequestDetails(requestId) {
    const currentUser = hospital.getCurrentUser();
    const requests = hospital.getDoctorAppointmentRequests(currentUser.username);
    const request = requests.find(r => r.requestId === requestId);

    if (!request) return;

    const detailsDiv = document.getElementById('requestDetails');
    detailsDiv.innerHTML = `
        <div class="detail-item">
            <span class="label">Patient Name:</span>
            <span class="value">${request.patientName}</span>
        </div>
        <div class="detail-item">
            <span class="label">Email:</span>
            <span class="value">${request.patientEmail}</span>
        </div>
        <div class="detail-item">
            <span class="label">Mobile:</span>
            <span class="value">${request.patientMobile}</span>
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
    `;

    document.getElementById('requestModal').dataset.requestId = requestId;

    const actions = document.getElementById('requestModalActions');
    if (request.status === 'Pending') {
        actions.style.display = 'flex';
    } else {
        actions.style.display = 'none';
    }

    document.getElementById('requestModal').style.display = 'block';
}

function showApprovalForm() {
    const requestId = document.getElementById('requestModal').dataset.requestId;
    const currentUser = hospital.getCurrentUser();
    const requests = hospital.getDoctorAppointmentRequests(currentUser.username);
    const request = requests.find(r => r.requestId === requestId);

    if (!request) return;

    const approvalDiv = document.getElementById('approvalForm');
    const dateOptions = request.preferredDates.map(date => `
        <label class="date-option">
            <input type="radio" name="appointmentDate" value="${date}" required>
            <span>${date}</span>
        </label>
    `).join('');

    const timeOptions = request.preferredTimes.map(time => `
        <label class="time-option">
            <input type="radio" name="appointmentTime" value="${time}" required>
            <span>${time}</span>
        </label>
    `).join('');

    approvalDiv.innerHTML = `
        <div class="approval-info">
            <strong>Patient:</strong> ${request.patientName}<br>
            <strong>Reason:</strong> ${request.reason}
        </div>
        <div class="approval-selection">
            <h4>Select Appointment Date:</h4>
            <div class="date-options">
                ${dateOptions}
            </div>
            <h4>Select Appointment Time:</h4>
            <div class="time-options">
                ${timeOptions}
            </div>
        </div>
    `;

    document.getElementById('approvalModal').dataset.requestId = requestId;
    document.getElementById('requestModal').style.display = 'none';
    document.getElementById('approvalModal').style.display = 'block';
}

function confirmApproval() {
    const requestId = document.getElementById('approvalModal').dataset.requestId;
    const selectedDate = document.querySelector('input[name="appointmentDate"]:checked')?.value;
    const selectedTime = document.querySelector('input[name="appointmentTime"]:checked')?.value;

    if (!selectedDate || !selectedTime) {
        alert('Please select both date and time');
        return;
    }

    const currentUser = hospital.getCurrentUser();

    const result = hospital.approveAppointmentRequest(requestId, `Approved by Dr. ${currentUser.name}`);

    if (result.success) {
        // Update the appointment with specific date/time
        const allAppointments = JSON.parse(localStorage.getItem('approvedAppointments'));
        const newApt = allAppointments.find(a => a.requestId === requestId);
        if (newApt) {
            newApt.appointmentDate = selectedDate;
            newApt.appointmentTime = selectedTime;
            localStorage.setItem('approvedAppointments', JSON.stringify(allAppointments));
        }

        alert('Appointment approved and scheduled successfully');
        document.getElementById('approvalModal').style.display = 'none';
        displayAppointmentRequests();
        displayApprovedSchedule();
    } else {
        alert('Error approving appointment: ' + result.message);
    }
}

function rejectRequest() {
    const requestId = document.getElementById('requestModal').dataset.requestId;
    const reason = prompt('Enter reason for rejection:');

    if (!reason || reason.trim() === '') {
        return;
    }

    const result = hospital.rejectAppointmentRequest(requestId, reason);

    if (result.success) {
        alert('Request rejected successfully');
        document.getElementById('requestModal').style.display = 'none';
        displayAppointmentRequests();
    }
}

// ===== APPROVED SCHEDULE =====
function displayApprovedSchedule() {
    const currentUser = hospital.getCurrentUser();
    const appointments = hospital.getDoctorApprovedAppointments(currentUser.username);
    const container = document.getElementById('appointmentSchedule');

    if (appointments.length === 0) {
        container.innerHTML = '<div class="no-appointments">No scheduled appointments yet</div>';
        return;
    }

    // Sort by date and time
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
                    <span class="label">Date & Time:</span>
                    <span class="value">${apt.appointmentDate} at ${apt.appointmentTime}</span>
                </div>
                <div class="info-item">
                    <span class="label">Reason:</span>
                    <span class="value">${apt.reason}</span>
                </div>
                ${apt.status === 'Completed' ? `
                <div class="info-item">
                    <span class="label">Completion Notes:</span>
                    <span class="value">${apt.completionNotes || 'N/A'}</span>
                </div>
                ` : ''}
            </div>
            ${apt.status === 'Approved' ? `
            <div class="appointment-actions">
                <button class="btn-complete" onclick="completeAppointment('${apt.appointmentId}')">Mark as Completed</button>
            </div>
            ` : ''}
        </div>
    `).join('');
}

function completeAppointment(appointmentId) {
    const notes = prompt('Enter completion notes (optional):');
    const result = hospital.completeAppointment(appointmentId, notes || '');

    if (result.success) {
        alert('Appointment marked as completed');
        displayApprovedSchedule();
    } else {
        alert('Error: ' + result.message);
    }
}

// ===== PATIENT SEARCH =====
function searchPatients() {
    const searchTerm = document.getElementById('patientSearch').value.trim();

    if (!searchTerm) {
        showMessage('searchMessage', 'Please enter a search term', false);
        return;
    }

    const allPatients = hospital.getAllPatients();
    const results = allPatients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patientUserId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    displayPatients(results);
}

function displayAllPatients() {
    const allPatients = hospital.getAllPatients();
    displayPatients(allPatients);
}

function displayPatients(patients) {
    const container = document.getElementById('patientsGrid');

    if (patients.length === 0) {
        container.innerHTML = '<div class="no-results">No patients found</div>';
        return;
    }

    container.innerHTML = patients.map(patient => `
        <div class="patient-card" onclick="viewPatientDetails('${patient.patientUserId}')">
            <h3>${patient.name}</h3>
            <div class="patient-info">
                <div class="info-row">
                    <span class="label">ID:</span>
                    <span class="value">${patient.patientUserId}</span>
                </div>
                <div class="info-row">
                    <span class="label">Email:</span>
                    <span class="value">${patient.email}</span>
                </div>
                <div class="info-row">
                    <span class="label">Age:</span>
                    <span class="value">${patient.age} years</span>
                </div>
            </div>
        </div>
    `).join('');
}

function viewPatientDetails(patientUserId) {
    const allPatients = hospital.getAllPatients();
    const patient = allPatients.find(p => p.patientUserId === patientUserId);

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
            <span class="label">Mobile:</span>
            <span class="value">${patient.mobileNumber}</span>
        </div>
        <div class="detail-item">
            <span class="label">Age:</span>
            <span class="value">${patient.age} years</span>
        </div>
        <div class="detail-item">
            <span class="label">Blood Group:</span>
            <span class="value">${patient.bloodGroup}</span>
        </div>
        <div class="detail-item">
            <span class="label">Medical Conditions:</span>
            <span class="value">${patient.medicalConditions || 'None'}</span>
        </div>
        <div class="detail-item">
            <span class="label">Current Medications:</span>
            <span class="value">${patient.medications || 'None'}</span>
        </div>
        <div class="detail-item">
            <span class="label">Allergies:</span>
            <span class="value">${patient.allergies || 'None'}</span>
        </div>
    `;

    document.getElementById('patientModal').style.display = 'block';
}

function clearPatientsDisplay() {
    document.getElementById('patientsGrid').innerHTML = '<div class="no-results">No patients found. Use search to find patient records.</div>';
}

// ===== FETCH PATIENT BY ID =====
function fetchPatientById() {
    const patientId = document.getElementById('patientIdInput').value.trim();

    if (!patientId) {
        showMessage('fetchMessage', 'Please enter a patient ID', false);
        return;
    }

    const patient = hospital.getPatientById(patientId);

    if (!patient) {
        showMessage('fetchMessage', 'Patient not found. Please check the patient ID.', false);
        document.getElementById('fetchPatientResult').innerHTML = '<div class="no-results">No patient found with this ID.</div>';
        return;
    }

    showMessage('fetchMessage', 'Patient found successfully!', true);
    displayFetchedPatientInfo(patient);
}

function displayFetchedPatientInfo(patient) {
    const resultDiv = document.getElementById('fetchPatientResult');
    
    // Determine which ID field to use
    const patientIdentifier = patient.patientUserId || patient.patientId;
    
    const html = `
        <div class="patient-info-card">
            <div class="patient-header">
                <h3>${patient.name || patient.fullName}</h3>
                <p class="patient-id">ID: ${patientIdentifier}</p>
            </div>
            
            <div class="info-section">
                <h4>Personal Information</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">Full Name:</span>
                        <span class="value">${patient.name || patient.fullName}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Email:</span>
                        <span class="value">${patient.email || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Mobile Number:</span>
                        <span class="value">${patient.mobileNumber || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Age:</span>
                        <span class="value">${patient.age || 'N/A'} years</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Gender:</span>
                        <span class="value">${patient.gender || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Blood Group:</span>
                        <span class="value">${patient.bloodGroup || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div class="info-section">
                <h4>Medical Information</h4>
                <div class="info-grid">
                    <div class="info-item full-width">
                        <span class="label">Medical Conditions:</span>
                        <span class="value">${patient.medicalConditions || 'None reported'}</span>
                    </div>
                    <div class="info-item full-width">
                        <span class="label">Current Medications:</span>
                        <span class="value">${patient.medications || 'None reported'}</span>
                    </div>
                    <div class="info-item full-width">
                        <span class="label">Allergies:</span>
                        <span class="value">${patient.allergies || 'None reported'}</span>
                    </div>
                    <div class="info-item full-width">
                        <span class="label">Previous Surgeries:</span>
                        <span class="value">${patient.surgeries || 'None reported'}</span>
                    </div>
                </div>
            </div>

            <div class="info-section">
                <h4>Additional Information</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">Registration Date:</span>
                        <span class="value">${patient.registrationDate || 'N/A'}</span>
                    </div>
                    <div class="info-item full-width">
                        <span class="label">Address:</span>
                        <span class="value">${patient.address || 'N/A'}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    resultDiv.innerHTML = html;
}

function showMessage(elementId, message, isSuccess) {
    const div = document.getElementById(elementId);
    div.textContent = message;
    div.className = isSuccess ? 'message success' : 'message error';
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        hospital.logout();
        window.location.href = 'login.html';
    }
}

function initializeEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Availability form
    document.getElementById('availabilityForm').addEventListener('submit', handleAddAvailability);

    // Request filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            displayAppointmentRequests(this.getAttribute('data-filter'));
        });
    });

    // Patient search
    document.getElementById('searchPatientBtn').addEventListener('click', searchPatients);
    document.getElementById('patientSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchPatients();
    });

    document.getElementById('showAllCheckbox').addEventListener('change', function() {
        if (this.checked) {
            displayAllPatients();
        } else {
            clearPatientsDisplay();
        }
    });

    // Fetch patient by ID
    if (document.getElementById('fetchPatientBtn')) {
        document.getElementById('fetchPatientBtn').addEventListener('click', fetchPatientById);
        document.getElementById('patientIdInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') fetchPatientById();
        });
    }

    // Logout
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

    // Request modal buttons
    document.getElementById('approveRequestBtn').addEventListener('click', showApprovalForm);
    document.getElementById('rejectRequestBtn').addEventListener('click', rejectRequest);
    document.getElementById('confirmApprovalBtn').addEventListener('click', confirmApproval);

    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    if (tabName === 'requests') displayAppointmentRequests();
    if (tabName === 'schedule') displayApprovedSchedule();
}

// ===== AVAILABILITY MANAGEMENT =====
function handleAddAvailability(e) {
    e.preventDefault();

    const currentUser = hospital.getCurrentUser();
    const date = document.getElementById('availDate').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const slotsPerHour = document.getElementById('slotsPerHour').value;

    // Validate times
    if (startTime >= endTime) {
        showMessage('availMessage', 'End time must be after start time', false);
        return;
    }

    const availabilityData = {
        date: date,
        startTime: startTime,
        endTime: endTime,
        slotsPerHour: parseInt(slotsPerHour),
        maxCapacity: Math.floor((new Date(`2000-01-01T${endTime}`) - new Date(`2000-01-01T${startTime}`)) / (60 * 1000)) / (60 / slotsPerHour),
        bookedSlots: 0
    };

    const result = hospital.addDoctorAvailability(currentUser.username, availabilityData);

    if (result.success) {
        showMessage('availMessage', 'Availability slot added successfully', true);
        document.getElementById('availabilityForm').reset();
        loadAvailabilitySlots();

        setTimeout(() => {
            document.getElementById('availMessage').classList.remove('success');
        }, 3000);
    } else {
        showMessage('availMessage', 'Error adding availability', false);
    }
}

function loadAvailabilitySlots() {
    const currentUser = hospital.getCurrentUser();
    const slots = hospital.getDoctorAvailability(currentUser.username);
    const container = document.getElementById('availabilitySlots');

    if (slots.length === 0) {
        container.innerHTML = '<div class="no-slots">No available slots added yet</div>';
        return;
    }

    container.innerHTML = slots.map(slot => `
        <div class="slot-card">
            <div class="slot-header">
                <span class="slot-date">${slot.date}</span>
                <button class="btn-remove-slot" onclick="removeSlot('${slot.slotId}')">Remove</button>
            </div>
            <div class="slot-info">
                <div class="slot-info-item">
                    <span class="label">Time:</span>
                    <span class="value">${slot.startTime} - ${slot.endTime}</span>
                </div>
                <div class="slot-info-item">
                    <span class="label">Capacity:</span>
                    <span class="value">${slot.maxCapacity} appointments (${slot.slotsPerHour} per hour)</span>
                </div>
                <div class="slot-info-item">
                    <span class="label">Booked:</span>
                    <span class="value">${slot.bookedSlots} / ${slot.maxCapacity}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function removeSlot(slotId) {
    if (confirm('Are you sure you want to remove this availability slot?')) {
        const result = hospital.removeAvailabilitySlot(slotId);
        if (result.success) {
            alert('Slot removed successfully');
            loadAvailabilitySlots();
        }
    }
}

// ===== APPOINTMENT REQUESTS =====
function displayAppointmentRequests(filter = 'all') {
    const currentUser = hospital.getCurrentUser();
    const requests = hospital.getDoctorAppointmentRequests(currentUser.username);
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
                    <span class="label">Email:</span>
                    <span class="value">${req.patientEmail}</span>
                </div>
                <div class="info-item">
                    <span class="label">Reason:</span>
                    <span class="value">${req.reason.substring(0, 50)}...</span>
                </div>
                <div class="info-item">
                    <span class="label">Preferred Dates:</span>
                    <span class="value">${req.preferredDates.length} date(s)</span>
                </div>
            </div>
        </div>
    `).join('');
}

function viewRequestDetails(requestId) {
    const currentUser = hospital.getCurrentUser();
    const requests = hospital.getDoctorAppointmentRequests(currentUser.username);
    const request = requests.find(r => r.requestId === requestId);

    if (!request) return;

    const detailsDiv = document.getElementById('requestDetails');
    detailsDiv.innerHTML = `
        <div class="detail-item">
            <span class="label">Patient Name:</span>
            <span class="value">${request.patientName}</span>
        </div>
        <div class="detail-item">
            <span class="label">Email:</span>
            <span class="value">${request.patientEmail}</span>
        </div>
        <div class="detail-item">
            <span class="label">Mobile:</span>
            <span class="value">${request.patientMobile}</span>
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
    `;

    document.getElementById('requestModal').dataset.requestId = requestId;

    const actions = document.getElementById('requestModalActions');
    if (request.status === 'Pending') {
        actions.style.display = 'flex';
    } else {
        actions.style.display = 'none';
    }

    document.getElementById('requestModal').style.display = 'block';
}

function showApprovalForm() {
    const requestId = document.getElementById('requestModal').dataset.requestId;
    const currentUser = hospital.getCurrentUser();
    const requests = hospital.getDoctorAppointmentRequests(currentUser.username);
    const request = requests.find(r => r.requestId === requestId);

    if (!request) return;

    const approvalDiv = document.getElementById('approvalForm');
    const dateOptions = request.preferredDates.map(date => `
        <label class="date-option">
            <input type="radio" name="appointmentDate" value="${date}" required>
            <span>${date}</span>
        </label>
    `).join('');

    const timeOptions = request.preferredTimes.map(time => `
        <label class="time-option">
            <input type="radio" name="appointmentTime" value="${time}" required>
            <span>${time}</span>
        </label>
    `).join('');

    approvalDiv.innerHTML = `
        <div class="approval-info">
            <strong>Patient:</strong> ${request.patientName}<br>
            <strong>Reason:</strong> ${request.reason}
        </div>
        <div class="approval-selection">
            <h4>Select Appointment Date:</h4>
            <div class="date-options">
                ${dateOptions}
            </div>
            <h4>Select Appointment Time:</h4>
            <div class="time-options">
                ${timeOptions}
            </div>
        </div>
    `;

    document.getElementById('approvalModal').dataset.requestId = requestId;
    document.getElementById('requestModal').style.display = 'none';
    document.getElementById('approvalModal').style.display = 'block';
}

function confirmApproval() {
    const requestId = document.getElementById('approvalModal').dataset.requestId;
    const selectedDate = document.querySelector('input[name="appointmentDate"]:checked')?.value;
    const selectedTime = document.querySelector('input[name="appointmentTime"]:checked')?.value;

    if (!selectedDate || !selectedTime) {
        alert('Please select both date and time');
        return;
    }

    const currentUser = hospital.getCurrentUser();
    const requests = hospital.getDoctorAppointmentRequests(currentUser.username);
    const request = requests.find(r => r.requestId === requestId);

    // Create approved appointment
    const appointmentData = {
        ...request,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime
    };

    const result = hospital.approveAppointmentRequest(requestId, `Approved by Dr. ${currentUser.name}`);

    if (result.success) {
        // Update the appointment with specific date/time
        const allAppointments = JSON.parse(localStorage.getItem('approvedAppointments'));
        const newApt = allAppointments.find(a => a.requestId === requestId);
        if (newApt) {
            newApt.appointmentDate = selectedDate;
            newApt.appointmentTime = selectedTime;
            localStorage.setItem('approvedAppointments', JSON.stringify(allAppointments));
        }

        alert('Appointment approved and scheduled successfully');
        document.getElementById('approvalModal').style.display = 'none';
        displayAppointmentRequests();
        displayApprovedSchedule();
    } else {
        alert('Error approving appointment: ' + result.message);
    }
}

function rejectRequest() {
    const requestId = document.getElementById('requestModal').dataset.requestId;
    const reason = prompt('Enter reason for rejection:');

    if (!reason || reason.trim() === '') {
        return;
    }

    const result = hospital.rejectAppointmentRequest(requestId, reason);

    if (result.success) {
        alert('Request rejected successfully');
        document.getElementById('requestModal').style.display = 'none';
        displayAppointmentRequests();
    }
}

// ===== APPROVED SCHEDULE =====
function displayApprovedSchedule() {
    const currentUser = hospital.getCurrentUser();
    const appointments = hospital.getDoctorApprovedAppointments(currentUser.username);
    const container = document.getElementById('appointmentSchedule');

    if (appointments.length === 0) {
        container.innerHTML = '<div class="no-appointments">No scheduled appointments yet</div>';
        return;
    }

    // Sort by date and time
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
                    <span class="label">Date & Time:</span>
                    <span class="value">${apt.appointmentDate} at ${apt.appointmentTime}</span>
                </div>
                <div class="info-item">
                    <span class="label">Reason:</span>
                    <span class="value">${apt.reason}</span>
                </div>
                ${apt.status === 'Completed' ? `
                <div class="info-item">
                    <span class="label">Completion Notes:</span>
                    <span class="value">${apt.completionNotes || 'N/A'}</span>
                </div>
                ` : ''}
            </div>
            ${apt.status === 'Approved' ? `
            <div class="appointment-actions">
                <button class="btn-complete" onclick="completeAppointment('${apt.appointmentId}')">Mark as Completed</button>
            </div>
            ` : ''}
        </div>
    `).join('');
}

function completeAppointment(appointmentId) {
    const notes = prompt('Enter completion notes (optional):');
    const result = hospital.completeAppointment(appointmentId, notes || '');

    if (result.success) {
        alert('Appointment marked as completed');
        displayApprovedSchedule();
    } else {
        alert('Error: ' + result.message);
    }
}

// ===== PATIENT SEARCH =====
function searchPatients() {
    const searchTerm = document.getElementById('patientSearch').value.trim();

    if (!searchTerm) {
        showMessage('searchMessage', 'Please enter a search term', false);
        return;
    }

    const allPatients = hospital.getAllPatients();
    const results = allPatients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patientUserId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    displayPatients(results);
}

function displayAllPatients() {
    const allPatients = hospital.getAllPatients();
    displayPatients(allPatients);
}

function displayPatients(patients) {
    const container = document.getElementById('patientsGrid');

    if (patients.length === 0) {
        container.innerHTML = '<div class="no-results">No patients found</div>';
        return;
    }

    container.innerHTML = patients.map(patient => `
        <div class="patient-card" onclick="viewPatientDetails('${patient.patientUserId}')">
            <h3>${patient.name}</h3>
            <div class="patient-info">
                <div class="info-row">
                    <span class="label">ID:</span>
                    <span class="value">${patient.patientUserId}</span>
                </div>
                <div class="info-row">
                    <span class="label">Email:</span>
                    <span class="value">${patient.email}</span>
                </div>
                <div class="info-row">
                    <span class="label">Age:</span>
                    <span class="value">${patient.age} years</span>
                </div>
            </div>
        </div>
    `).join('');
}

function viewPatientDetails(patientUserId) {
    const allPatients = hospital.getAllPatients();
    const patient = allPatients.find(p => p.patientUserId === patientUserId);

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
            <span class="label">Mobile:</span>
            <span class="value">${patient.mobileNumber}</span>
        </div>
        <div class="detail-item">
            <span class="label">Age:</span>
            <span class="value">${patient.age} years</span>
        </div>
        <div class="detail-item">
            <span class="label">Blood Group:</span>
            <span class="value">${patient.bloodGroup}</span>
        </div>
        <div class="detail-item">
            <span class="label">Medical Conditions:</span>
            <span class="value">${patient.medicalConditions || 'None'}</span>
        </div>
        <div class="detail-item">
            <span class="label">Current Medications:</span>
            <span class="value">${patient.medications || 'None'}</span>
        </div>
        <div class="detail-item">
            <span class="label">Allergies:</span>
            <span class="value">${patient.allergies || 'None'}</span>
        </div>
    `;

    document.getElementById('patientModal').style.display = 'block';
}

function clearPatientsDisplay() {
    document.getElementById('patientsGrid').innerHTML = '<div class="no-results">No patients found. Use search to find patient records.</div>';
}

function showMessage(elementId, message, isSuccess) {
    const div = document.getElementById(elementId);
    div.textContent = message;
    div.className = isSuccess ? 'message success' : 'message error';
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        hospital.logout();
        window.location.href = 'login.html';
    }
}

function searchPatients() {
    const searchTerm = document.getElementById('patientSearch').value.toLowerCase().trim();
    
    if (!searchTerm) {
        const messageDiv = document.getElementById('searchMessage');
        messageDiv.classList.remove('success');
        messageDiv.classList.add('error');
        messageDiv.textContent = 'Please enter a patient name or ID to search.';
        
        setTimeout(() => {
            messageDiv.classList.remove('error');
            messageDiv.textContent = '';
        }, 3000);
        return;
    }

    const allPatients = hospital.getAllPatients();
    const filtered = allPatients.filter(patient => 
        patient.fullName.toLowerCase().includes(searchTerm) ||
        patient.patientId.toLowerCase().includes(searchTerm)
    );

    displayPatients(filtered, searchTerm);
}

function displayAllPatients() {
    const allPatients = hospital.getAllPatients();
    displayPatients(allPatients, '');
}

function displayPatients(patients, searchTerm) {
    const patientsGrid = document.getElementById('patientsGrid');
    const messageDiv = document.getElementById('searchMessage');

    if (patients.length === 0) {
        patientsGrid.innerHTML = '<div class="no-results">No patients found matching your search.</div>';
        
        if (searchTerm) {
            messageDiv.classList.remove('success');
            messageDiv.classList.add('error');
            messageDiv.textContent = 'No patients found with the name or ID: ' + searchTerm;
            
            setTimeout(() => {
                messageDiv.classList.remove('error');
                messageDiv.textContent = '';
            }, 3000);
        }
        return;
    }

    messageDiv.classList.remove('error');
    messageDiv.classList.add('success');
    messageDiv.textContent = 'Found ' + patients.length + ' patient(s)';
    
    setTimeout(() => {
        messageDiv.classList.remove('success');
        messageDiv.textContent = '';
    }, 3000);

    patientsGrid.innerHTML = patients.map(patient => `
        <div class="patient-card" onclick="viewPatientDetails('${patient.patientId}')">
            <div class="card-header">
                <h3>${patient.fullName}</h3>
                <span class="patient-id">${patient.patientId}</span>
            </div>
            <div class="card-info">
                <div class="card-info-item">
                    <span class="info-label">Age:</span>
                    <span class="info-value">${patient.age} years</span>
                </div>
                <div class="card-info-item">
                    <span class="info-label">Gender:</span>
                    <span class="info-value">${patient.gender}</span>
                </div>
                <div class="card-info-item">
                    <span class="info-label">Blood Group:</span>
                    <span class="info-value">${patient.bloodGroup}</span>
                </div>
                <div class="card-info-item">
                    <span class="info-label">Contact:</span>
                    <span class="info-value">${patient.mobileNumber}</span>
                </div>
                <div class="card-info-item">
                    <span class="info-label">Registered:</span>
                    <span class="info-value">${patient.registrationDate}</span>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn-view-details">View Full Details</button>
            </div>
        </div>
    `).join('');
}

function viewPatientDetails(patientId) {
    const patient = hospital.getPatientById(patientId);
    
    if (!patient) {
        alert('Patient not found');
        return;
    }

    const detailsDiv = document.getElementById('patientDetails');
    
    let medicalHistoryHtml = '';
    if (patient.medicalHistory) {
        medicalHistoryHtml = `
            <div class="patient-details-section">
                <h3>Medical History</h3>
                <div class="patient-details-item">
                    <div class="patient-details-value">${patient.medicalHistory}</div>
                </div>
            </div>
        `;
    }

    let allergiesHtml = '';
    if (patient.allergies) {
        allergiesHtml = `
            <div class="patient-details-section">
                <h3>Allergies</h3>
                <div class="patient-details-item">
                    <div class="patient-details-value">${patient.allergies}</div>
                </div>
            </div>
        `;
    }

    detailsDiv.innerHTML = `
        <div class="patient-details-item">
            <span class="patient-details-label">Patient ID</span>
            <span class="patient-details-value">${patient.patientId}</span>
        </div>
        <div class="patient-details-item">
            <span class="patient-details-label">Full Name</span>
            <span class="patient-details-value">${patient.fullName}</span>
        </div>
        <div class="patient-details-item">
            <span class="patient-details-label">Age</span>
            <span class="patient-details-value">${patient.age}</span>
        </div>
        <div class="patient-details-item">
            <span class="patient-details-label">Gender</span>
            <span class="patient-details-value">${patient.gender}</span>
        </div>
        <div class="patient-details-item">
            <span class="patient-details-label">Blood Group</span>
            <span class="patient-details-value">${patient.bloodGroup}</span>
        </div>
        <div class="patient-details-item">
            <span class="patient-details-label">Email</span>
            <span class="patient-details-value">${patient.email}</span>
        </div>
        <div class="patient-details-item">
            <span class="patient-details-label">Mobile Number</span>
            <span class="patient-details-value">${patient.mobileNumber}</span>
        </div>
        <div class="patient-details-item">
            <span class="patient-details-label">Address</span>
            <span class="patient-details-value">${patient.address}, ${patient.city}, ${patient.state} ${patient.zipCode}</span>
        </div>
        <div class="patient-details-item">
            <span class="patient-details-label">Registration Date</span>
            <span class="patient-details-value">${patient.registrationDate}</span>
        </div>
        <div class="patient-details-item">
            <span class="patient-details-label">Emergency Contact</span>
            <span class="patient-details-value">${patient.emergencyContact}</span>
        </div>
        <div class="patient-details-item">
            <span class="patient-details-label">Emergency Phone</span>
            <span class="patient-details-value">${patient.emergencyPhone}</span>
        </div>
        ${medicalHistoryHtml}
        ${allergiesHtml}
    `;

    // Show modal
    document.getElementById('patientModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('patientModal').style.display = 'none';
}

function clearPatientsDisplay() {
    document.getElementById('patientsGrid').innerHTML = '<div class="no-results">No patients found. Use search to find patient records.</div>';
    document.getElementById('patientSearch').value = '';
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        hospital.logout();
        window.location.href = 'login.html';
    }
}


