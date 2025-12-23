// Patient Portal - Appointment Request System

document.addEventListener('DOMContentLoaded', function() {
    const currentUser = hospital.getCurrentUser();
    if (!currentUser || currentUser.role !== 'patient') {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('patientName').textContent = currentUser.name;
    initializeEventListeners();
    loadDoctors();
    generatePreferredDates();
    displayRequests();
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
    document.getElementById('appointmentForm').addEventListener('submit', handleRequestAppointment);

    // Doctor selection
    document.getElementById('doctor').addEventListener('change', function() {
        const doctors = hospital.getAllDoctors();
        const selected = doctors.find(d => d.username === this.value);
        if (selected) {
            document.getElementById('specialization').value = selected.specialization;
        }
    });

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

    // Cancel request button
    document.getElementById('cancelRequestBtn').addEventListener('click', cancelRequest);
    document.getElementById('cancelAppointmentBtn').addEventListener('click', cancelAppointment);

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

    if (tabName === 'requests') displayRequests();
    if (tabName === 'scheduled') displayScheduledAppointments();
}

function loadDoctors() {
    const doctors = hospital.getAllDoctors();
    const select = document.getElementById('doctor');
    
    doctors.forEach(doc => {
        const option = document.createElement('option');
        option.value = doc.username;
        option.textContent = `${doc.name} - ${doc.specialization}`;
        select.appendChild(option);
    });
}

function generatePreferredDates() {
    const container = document.getElementById('preferredDates');
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        
        const checkbox = document.createElement('label');
        checkbox.innerHTML = `<input type="checkbox" name="date" value="${dateStr}"> ${label}`;
        container.appendChild(checkbox);
    }
}

function handleRequestAppointment(e) {
    e.preventDefault();

    const currentUser = hospital.getCurrentUser();
    const doctorUsername = document.getElementById('doctor').value;
    const reason = document.getElementById('reason').value;
    const notes = document.getElementById('notes').value;

    // Get selected dates
    const selectedDates = Array.from(document.querySelectorAll('input[name="date"]:checked')).map(cb => cb.value);
    
    // Get selected times
    const selectedTimes = Array.from(document.querySelectorAll('input[name="time"]:checked')).map(cb => cb.value);

    if (!doctorUsername) {
        showMessage('bookMessage', 'Please select a doctor', false);
        return;
    }

    if (selectedDates.length === 0) {
        showMessage('bookMessage', 'Please select at least one preferred date', false);
        return;
    }

    if (selectedTimes.length === 0) {
        showMessage('bookMessage', 'Please select at least one preferred time', false);
        return;
    }

    const doctors = hospital.getAllDoctors();
    const selectedDoctor = doctors.find(d => d.username === doctorUsername);

    const requestData = {
        patientUserId: currentUser.patientUserId,
        patientName: currentUser.name,
        patientEmail: currentUser.email,
        patientMobile: currentUser.mobileNumber,
        doctorUsername: doctorUsername,
        doctorName: selectedDoctor.name,
        specialization: selectedDoctor.specialization,
        reason: reason,
        notes: notes,
        preferredDates: selectedDates,
        preferredTimes: selectedTimes
    };

    const result = hospital.requestAppointment(requestData);

    if (result.success) {
        showMessage('bookMessage', 'Request submitted successfully (ID: ' + result.requestId + ')', true);
        document.getElementById('appointmentForm').reset();
        document.getElementById('specialization').value = '';
        document.querySelectorAll('input[name="date"]').forEach(cb => cb.checked = false);
        document.querySelectorAll('input[name="time"]').forEach(cb => cb.checked = false);

        setTimeout(() => {
            document.getElementById('bookMessage').classList.remove('success');
            document.getElementById('bookMessage').textContent = '';
        }, 4000);
    } else {
        showMessage('bookMessage', result.message, false);
    }
}

function displayRequests() {
    const currentUser = hospital.getCurrentUser();
    const requests = hospital.getPatientAppointmentRequests(currentUser.patientUserId);
    const container = document.getElementById('requestsContainer');

    if (requests.length === 0) {
        container.innerHTML = '<div class="no-requests">No requests submitted yet</div>';
        return;
    }

    container.innerHTML = requests.map(req => `
        <div class="request-card ${req.status === 'Rejected' ? 'rejected' : ''}" onclick="viewRequestDetails('${req.requestId}')">
            <div class="request-header">
                <h3>${req.doctorName}</h3>
                <span class="status-badge status-${req.status.toLowerCase()}">${req.status}</span>
            </div>
            <div class="request-info">
                <div class="info-item">
                    <span class="label">Specialization:</span>
                    <span class="value">${req.specialization}</span>
                </div>
                <div class="info-item">
                    <span class="label">Reason:</span>
                    <span class="value">${req.reason.substring(0, 40)}...</span>
                </div>
                <div class="info-item">
                    <span class="label">Requested:</span>
                    <span class="value">${req.requestDate} at ${req.requestTime}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function viewRequestDetails(requestId) {
    const currentUser = hospital.getCurrentUser();
    const requests = hospital.getPatientAppointmentRequests(currentUser.patientUserId);
    const request = requests.find(r => r.requestId === requestId);

    if (!request) return;

    const detailsDiv = document.getElementById('requestDetails');
    detailsDiv.innerHTML = `
        <div class="detail-item">
            <span class="detail-label">Request ID:</span>
            <span class="detail-value">${request.requestId}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Doctor:</span>
            <span class="detail-value">${request.doctorName}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Specialization:</span>
            <span class="detail-value">${request.specialization}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Status:</span>
            <span class="detail-value"><strong>${request.status}</strong></span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Reason for Visit:</span>
            <span class="detail-value">${request.reason}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Preferred Dates:</span>
            <span class="detail-value">${request.preferredDates.join(', ')}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Preferred Times:</span>
            <span class="detail-value">${request.preferredTimes.join(', ')}</span>
        </div>
        ${request.notes ? `
        <div class="detail-item">
            <span class="detail-label">Additional Notes:</span>
            <span class="detail-value">${request.notes}</span>
        </div>
        ` : ''}
        ${request.rejectionReason ? `
        <div class="detail-item rejection">
            <span class="detail-label">Rejection Reason:</span>
            <span class="detail-value">${request.rejectionReason}</span>
        </div>
        ` : ''}
        <div class="detail-item">
            <span class="detail-label">Submitted:</span>
            <span class="detail-value">${request.requestDate} at ${request.requestTime}</span>
        </div>
    `;

    document.getElementById('requestModal').dataset.requestId = requestId;

    const cancelBtn = document.getElementById('cancelRequestBtn');
    if (request.status === 'Pending') {
        cancelBtn.style.display = 'block';
    } else {
        cancelBtn.style.display = 'none';
    }

    document.getElementById('requestModal').style.display = 'block';
}

function displayScheduledAppointments() {
    const currentUser = hospital.getCurrentUser();
    const appointments = hospital.getPatientApprovedAppointments(currentUser.patientUserId);
    const container = document.getElementById('scheduledContainer');

    if (appointments.length === 0) {
        container.innerHTML = '<div class="no-appointments">No scheduled appointments</div>';
        return;
    }

    container.innerHTML = appointments.map(apt => `
        <div class="appointment-card" onclick="viewAppointmentDetails('${apt.appointmentId}')">
            <div class="apt-header">
                <h3>${apt.doctorName}</h3>
                <span class="status-badge status-${apt.status.toLowerCase()}">${apt.status}</span>
            </div>
            <div class="apt-info">
                <div class="info-item">
                    <span class="label">Specialization:</span>
                    <span class="value">${apt.specialization}</span>
                </div>
                <div class="info-item">
                    <span class="label">Date & Time:</span>
                    <span class="value">${apt.appointmentDate} at ${apt.appointmentTime}</span>
                </div>
                <div class="info-item">
                    <span class="label">Location:</span>
                    <span class="value">Hospital</span>
                </div>
            </div>
        </div>
    `).join('');
}

function viewAppointmentDetails(appointmentId) {
    const currentUser = hospital.getCurrentUser();
    const appointments = hospital.getPatientApprovedAppointments(currentUser.patientUserId);
    const apt = appointments.find(a => a.appointmentId === appointmentId);

    if (!apt) return;

    const detailsDiv = document.getElementById('appointmentDetails');
    detailsDiv.innerHTML = `
        <div class="detail-item">
            <span class="detail-label">Appointment ID:</span>
            <span class="detail-value">${apt.appointmentId}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Doctor:</span>
            <span class="detail-value">${apt.doctorName}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Specialization:</span>
            <span class="detail-value">${apt.specialization}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Status:</span>
            <span class="detail-value"><strong>${apt.status}</strong></span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${apt.appointmentDate}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Time:</span>
            <span class="detail-value">${apt.appointmentTime}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Reason for Visit:</span>
            <span class="detail-value">${apt.reason}</span>
        </div>
        ${apt.adminNotes ? `
        <div class="detail-item">
            <span class="detail-label">Admin Notes:</span>
            <span class="detail-value">${apt.adminNotes}</span>
        </div>
        ` : ''}
        ${apt.completionNotes ? `
        <div class="detail-item">
            <span class="detail-label">Completion Notes:</span>
            <span class="detail-value">${apt.completionNotes}</span>
        </div>
        ` : ''}
    `;

    document.getElementById('appointmentModal').dataset.appointmentId = appointmentId;

    const cancelBtn = document.getElementById('cancelAppointmentBtn');
    if (apt.status === 'Approved' || apt.status === 'Pending') {
        cancelBtn.style.display = 'block';
    } else {
        cancelBtn.style.display = 'none';
    }

    document.getElementById('appointmentModal').style.display = 'block';
}

function cancelRequest() {
    const requestId = document.getElementById('requestModal').dataset.requestId;
    
    if (confirm('Are you sure you want to cancel this request?')) {
        const currentUser = hospital.getCurrentUser();
        let requests = hospital.getPatientAppointmentRequests(currentUser.patientUserId);
        
        const index = requests.findIndex(r => r.requestId === requestId);
        if (index !== -1) {
            requests[index].status = 'Cancelled';
            localStorage.setItem('appointmentRequests', JSON.stringify(hospital.getAllAppointmentRequests().map(r => 
                r.requestId === requestId ? { ...r, status: 'Cancelled' } : r
            )));
            
            alert('Request cancelled successfully');
            document.getElementById('requestModal').style.display = 'none';
            displayRequests();
        }
    }
}

function cancelAppointment() {
    const appointmentId = document.getElementById('appointmentModal').dataset.appointmentId;
    
    if (confirm('Are you sure you want to cancel this appointment?')) {
        const result = hospital.cancelApprovedAppointment(appointmentId, 'Cancelled by patient');
        
        if (result.success) {
            alert('Appointment cancelled successfully');
            document.getElementById('appointmentModal').style.display = 'none';
            displayScheduledAppointments();
        }
    }
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
