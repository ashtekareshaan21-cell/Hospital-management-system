// Hospital Management System - Local Storage Backend
// This module handles all patient data operations with localStorage

class HospitalBackend {
    constructor() {
        this.storageKey = 'hospitalPatients';
        this.adminKey = 'hospitalAdmin';
        this.doctorKey = 'hospitalDoctors';
        this.patientUsersKey = 'patientUsers';
        this.appointmentRequestsKey = 'appointmentRequests';
        this.doctorAvailabilityKey = 'doctorAvailability';
        this.approvedAppointmentsKey = 'approvedAppointments';
        this.initializeStorage();
    }

    // Initialize storage with default data if it doesn't exist
    initializeStorage() {
        if (!localStorage.getItem(this.adminKey)) {
            const defaultAdmin = {
                username: 'admin',
                password: 'admin123',
                name: 'Admin'
            };
            localStorage.setItem(this.adminKey, JSON.stringify(defaultAdmin));
        }

        if (!localStorage.getItem(this.doctorKey)) {
            const defaultDoctors = [
                { username: 'doctor1', password: 'doc123', name: 'Dr. Sharma', specialization: 'Cardiology' },
                { username: 'doctor2', password: 'doc123', name: 'Dr. Patel', specialization: 'Neurology' },
                { username: 'doctor3', password: 'doc123', name: 'Dr. Singh', specialization: 'General Medicine' },
                { username: 'doctor4', password: 'doc123', name: 'Dr. Verma', specialization: 'Pediatrics' }
            ];
            localStorage.setItem(this.doctorKey, JSON.stringify(defaultDoctors));
        }

        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }

        if (!localStorage.getItem(this.patientUsersKey)) {
            localStorage.setItem(this.patientUsersKey, JSON.stringify([]));
        }

        if (!localStorage.getItem(this.appointmentRequestsKey)) {
            localStorage.setItem(this.appointmentRequestsKey, JSON.stringify([]));
        }

        if (!localStorage.getItem(this.doctorAvailabilityKey)) {
            localStorage.setItem(this.doctorAvailabilityKey, JSON.stringify([]));
        }

        if (!localStorage.getItem(this.approvedAppointmentsKey)) {
            localStorage.setItem(this.approvedAppointmentsKey, JSON.stringify([]));
        }
    }

    // Admin Login
    adminLogin(username, password) {
        const admin = JSON.parse(localStorage.getItem(this.adminKey));
        if (admin && admin.username === username && admin.password === password) {
            sessionStorage.setItem('currentUser', JSON.stringify({ role: 'admin', name: admin.name }));
            return { success: true, message: 'Admin login successful' };
        }
        return { success: false, message: 'Invalid admin credentials' };
    }

    // Doctor Login
    doctorLogin(username, password) {
        const doctors = JSON.parse(localStorage.getItem(this.doctorKey));
        const doctor = doctors.find(d => d.username === username && d.password === password);
        if (doctor) {
            sessionStorage.setItem('currentUser', JSON.stringify({ role: 'doctor', name: doctor.name, specialization: doctor.specialization }));
            return { success: true, message: 'Doctor login successful' };
        }
        return { success: false, message: 'Invalid doctor credentials' };
    }

    // Register a new patient
    registerPatient(patientData) {
        const patients = JSON.parse(localStorage.getItem(this.storageKey));
        
        // Check if patient already exists
        const existingPatient = patients.find(p => p.email === patientData.email || p.mobileNumber === patientData.mobileNumber);
        if (existingPatient) {
            return { success: false, message: 'Patient with this email or mobile number already exists' };
        }

        // Add timestamp
        patientData.registrationDate = new Date().toLocaleDateString();
        patientData.patientId = this.generatePatientId();

        patients.push(patientData);
        localStorage.setItem(this.storageKey, JSON.stringify(patients));

        return { success: true, message: 'Patient registered successfully', patientId: patientData.patientId };
    }

    // Get all patients
    getAllPatients() {
        return JSON.parse(localStorage.getItem(this.storageKey));
    }

    // Get patient by ID
    getPatientById(patientId) {
        const patients = JSON.parse(localStorage.getItem(this.storageKey));
        return patients.find(p => p.patientId === patientId || p.patientUserId === patientId);
    }

    // Get patients by name (for doctor search)
    getPatientsByName(name) {
        const patients = JSON.parse(localStorage.getItem(this.storageKey));
        return patients.filter(p => p.fullName.toLowerCase().includes(name.toLowerCase()));
    }

    // Update patient data
    updatePatient(patientId, updatedData) {
        const patients = JSON.parse(localStorage.getItem(this.storageKey));
        const index = patients.findIndex(p => p.patientId === patientId);

        if (index !== -1) {
            patients[index] = { ...patients[index], ...updatedData };
            localStorage.setItem(this.storageKey, JSON.stringify(patients));
            return { success: true, message: 'Patient data updated successfully' };
        }

        return { success: false, message: 'Patient not found' };
    }

    // Delete patient
    deletePatient(patientId) {
        let patients = JSON.parse(localStorage.getItem(this.storageKey));
        const initialLength = patients.length;
        patients = patients.filter(p => p.patientId !== patientId);

        if (patients.length < initialLength) {
            localStorage.setItem(this.storageKey, JSON.stringify(patients));
            return { success: true, message: 'Patient deleted successfully' };
        }

        return { success: false, message: 'Patient not found' };
    }

    // Generate unique patient ID
    generatePatientId() {
        return 'PAT' + Date.now() + Math.floor(Math.random() * 1000);
    }

    // Logout
    logout() {
        sessionStorage.removeItem('currentUser');
        return { success: true, message: 'Logged out successfully' };
    }

    // Get current user
    getCurrentUser() {
        const user = sessionStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }

    // Patient Registration
    registerPatientUser(userData) {
        const patients = JSON.parse(localStorage.getItem(this.patientUsersKey));
        
        // Check if patient already exists
        const existingPatient = patients.find(p => p.email === userData.email || p.mobileNumber === userData.mobileNumber);
        if (existingPatient) {
            return { success: false, message: 'Patient with this email or mobile number already exists' };
        }

        userData.patientUserId = this.generatePatientId();
        userData.registrationDate = new Date().toLocaleDateString();
        patients.push(userData);
        localStorage.setItem(this.patientUsersKey, JSON.stringify(patients));

        return { success: true, message: 'Registration successful', patientUserId: userData.patientUserId };
    }

    // Patient Login
    patientLogin(email, password) {
        const patients = JSON.parse(localStorage.getItem(this.patientUsersKey));
        const patient = patients.find(p => p.email === email && p.password === password);
        
        if (patient) {
            sessionStorage.setItem('currentUser', JSON.stringify({ 
                role: 'patient', 
                name: patient.fullName, 
                email: patient.email,
                patientUserId: patient.patientUserId,
                mobileNumber: patient.mobileNumber
            }));
            return { success: true, message: 'Patient login successful' };
        }
        return { success: false, message: 'Invalid email or password' };
    }

    // Get all doctors
    getAllDoctors() {
        return JSON.parse(localStorage.getItem(this.doctorKey));
    }

    // ====== DOCTOR AVAILABILITY MANAGEMENT ======
    // Add doctor availability slot
    addDoctorAvailability(doctorUsername, availabilityData) {
        const availability = JSON.parse(localStorage.getItem(this.doctorAvailabilityKey));
        
        availabilityData.slotId = 'SLOT' + Date.now() + Math.floor(Math.random() * 1000);
        availabilityData.doctorUsername = doctorUsername;
        availabilityData.createdDate = new Date().toLocaleDateString();
        
        availability.push(availabilityData);
        localStorage.setItem(this.doctorAvailabilityKey, JSON.stringify(availability));
        
        return { success: true, message: 'Availability slot added', slotId: availabilityData.slotId };
    }

    // Get doctor availability slots
    getDoctorAvailability(doctorUsername) {
        const availability = JSON.parse(localStorage.getItem(this.doctorAvailabilityKey));
        return availability.filter(slot => slot.doctorUsername === doctorUsername);
    }

    // Remove availability slot
    removeAvailabilitySlot(slotId) {
        let availability = JSON.parse(localStorage.getItem(this.doctorAvailabilityKey));
        const initialLength = availability.length;
        availability = availability.filter(slot => slot.slotId !== slotId);

        if (availability.length < initialLength) {
            localStorage.setItem(this.doctorAvailabilityKey, JSON.stringify(availability));
            return { success: true, message: 'Slot removed successfully' };
        }
        return { success: false, message: 'Slot not found' };
    }

    // ====== APPOINTMENT REQUEST WORKFLOW ======
    // Patient requests appointment
    requestAppointment(appointmentData) {
        const requests = JSON.parse(localStorage.getItem(this.appointmentRequestsKey));
        
        appointmentData.requestId = 'REQ' + Date.now() + Math.floor(Math.random() * 1000);
        appointmentData.status = 'Pending'; // Pending, Approved, Rejected
        appointmentData.requestDate = new Date().toLocaleDateString();
        appointmentData.requestTime = new Date().toLocaleTimeString();
        
        requests.push(appointmentData);
        localStorage.setItem(this.appointmentRequestsKey, JSON.stringify(requests));
        
        return { success: true, message: 'Appointment request submitted', requestId: appointmentData.requestId };
    }

    // Get appointment requests for a doctor
    getDoctorAppointmentRequests(doctorUsername) {
        const requests = JSON.parse(localStorage.getItem(this.appointmentRequestsKey));
        return requests.filter(req => req.doctorUsername === doctorUsername);
    }

    // Get all appointment requests (for admin)
    getAllAppointmentRequests() {
        return JSON.parse(localStorage.getItem(this.appointmentRequestsKey));
    }

    // Get patient's appointment requests
    getPatientAppointmentRequests(patientUserId) {
        const requests = JSON.parse(localStorage.getItem(this.appointmentRequestsKey));
        return requests.filter(req => req.patientUserId === patientUserId);
    }

    // Approve appointment request
    approveAppointmentRequest(requestId, adminNotes) {
        let requests = JSON.parse(localStorage.getItem(this.appointmentRequestsKey));
        const request = requests.find(req => req.requestId === requestId);

        if (!request) {
            return { success: false, message: 'Request not found' };
        }

        // Create approved appointment
        const approvedAppointments = JSON.parse(localStorage.getItem(this.approvedAppointmentsKey));
        const appointment = {
            appointmentId: 'APT' + Date.now() + Math.floor(Math.random() * 1000),
            ...request,
            status: 'Approved',
            approvalDate: new Date().toLocaleDateString(),
            adminNotes: adminNotes,
            requestId: requestId
        };

        approvedAppointments.push(appointment);
        localStorage.setItem(this.approvedAppointmentsKey, JSON.stringify(approvedAppointments));

        // Update request status
        const reqIndex = requests.findIndex(req => req.requestId === requestId);
        requests[reqIndex].status = 'Approved';
        localStorage.setItem(this.appointmentRequestsKey, JSON.stringify(requests));

        return { success: true, message: 'Appointment approved successfully', appointmentId: appointment.appointmentId };
    }

    // Reject appointment request
    rejectAppointmentRequest(requestId, reason) {
        let requests = JSON.parse(localStorage.getItem(this.appointmentRequestsKey));
        const index = requests.findIndex(req => req.requestId === requestId);

        if (index === -1) {
            return { success: false, message: 'Request not found' };
        }

        requests[index].status = 'Rejected';
        requests[index].rejectionReason = reason;
        requests[index].rejectionDate = new Date().toLocaleDateString();
        localStorage.setItem(this.appointmentRequestsKey, JSON.stringify(requests));

        return { success: true, message: 'Appointment request rejected' };
    }

    // Get approved appointments for patient
    getPatientApprovedAppointments(patientUserId) {
        const appointments = JSON.parse(localStorage.getItem(this.approvedAppointmentsKey));
        return appointments.filter(apt => apt.patientUserId === patientUserId);
    }

    // Get all approved appointments (for admin)
    getAllApprovedAppointments() {
        return JSON.parse(localStorage.getItem(this.approvedAppointmentsKey));
    }

    // Get doctor's approved appointments
    getDoctorApprovedAppointments(doctorUsername) {
        const appointments = JSON.parse(localStorage.getItem(this.approvedAppointmentsKey));
        return appointments.filter(apt => apt.doctorUsername === doctorUsername && apt.status === 'Approved');
    }

    // Cancel approved appointment
    cancelApprovedAppointment(appointmentId, cancellationReason) {
        let appointments = JSON.parse(localStorage.getItem(this.approvedAppointmentsKey));
        const index = appointments.findIndex(apt => apt.appointmentId === appointmentId);

        if (index !== -1) {
            appointments[index].status = 'Cancelled';
            appointments[index].cancellationReason = cancellationReason;
            appointments[index].cancellationDate = new Date().toLocaleDateString();
            localStorage.setItem(this.approvedAppointmentsKey, JSON.stringify(appointments));
            return { success: true, message: 'Appointment cancelled successfully' };
        }

        return { success: false, message: 'Appointment not found' };
    }

    // Mark appointment as completed
    completeAppointment(appointmentId, notes) {
        let appointments = JSON.parse(localStorage.getItem(this.approvedAppointmentsKey));
        const index = appointments.findIndex(apt => apt.appointmentId === appointmentId);

        if (index !== -1) {
            appointments[index].status = 'Completed';
            appointments[index].completionNotes = notes;
            appointments[index].completionDate = new Date().toLocaleDateString();
            localStorage.setItem(this.approvedAppointmentsKey, JSON.stringify(appointments));
            return { success: true, message: 'Appointment marked as completed' };
        }

        return { success: false, message: 'Appointment not found' };
    }

    // Logout
    logout() {
        sessionStorage.removeItem('currentUser');
        return { success: true, message: 'Logged out successfully' };
    }


    // Get current user
    getCurrentUser() {
        const user = sessionStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }
}

// Initialize backend
const hospital = new HospitalBackend();
