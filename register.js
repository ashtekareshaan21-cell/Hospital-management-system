// Patient Registration JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.getElementById('registrationForm');
    registrationForm.addEventListener('submit', handleRegistration);
});

function handleRegistration(e) {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value;
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;
    const bloodGroup = document.getElementById('bloodGroup').value;
    const email = document.getElementById('email').value;
    const mobileNumber = document.getElementById('mobileNumber').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const zipCode = document.getElementById('zipCode').value;
    const medicalHistory = document.getElementById('medicalHistory').value;

    // Validate password
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', false);
        return;
    }

    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long', false);
        return;
    }

    const userData = {
        fullName,
        age,
        gender,
        bloodGroup,
        email,
        mobileNumber,
        password,
        address,
        city,
        state,
        zipCode,
        medicalHistory
    };

    const result = hospital.registerPatientUser(userData);
    const messageDiv = document.getElementById('registerMessage');

    if (result.success) {
        messageDiv.classList.remove('error');
        messageDiv.classList.add('success');
        messageDiv.textContent = result.message + ' Redirecting to login...';
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
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

function showMessage(message, isSuccess) {
    const messageDiv = document.getElementById('registerMessage');
    messageDiv.textContent = message;
    messageDiv.classList.remove('error', 'success');
    messageDiv.classList.add(isSuccess ? 'success' : 'error');
}
