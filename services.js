// Get modal elements
const serviceModal = document.getElementById('serviceModal');
const doctorModal = document.getElementById('doctorModal');

// Service buttons - Open modal
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('btn-service') || event.target.closest('.btn-service')) {
        const button = event.target.closest('.btn-service');
        const serviceName = button.getAttribute('data-service');
        const description = button.getAttribute('data-description');
        
        document.getElementById('serviceTitle').textContent = serviceName;
        document.getElementById('serviceDescription').textContent = description;
        
        serviceModal.style.display = 'block';
    }
});

// Doctor buttons - Open modal
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('btn-doctor') || event.target.closest('.btn-doctor')) {
        const button = event.target.closest('.btn-doctor');
        const doctorName = button.getAttribute('data-name');
        const specialty = button.getAttribute('data-specialty');
        const image = button.getAttribute('data-image');
        const bio = button.getAttribute('data-bio');
        
        document.getElementById('doctorName').textContent = doctorName;
        document.getElementById('doctorSpecialty').textContent = specialty;
        document.getElementById('doctorImage').src = image;
        document.getElementById('doctorBio').textContent = bio;
        
        doctorModal.style.display = 'block';
    }
});

// Close button click handler
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('close')) {
        serviceModal.style.display = 'none';
        doctorModal.style.display = 'none';
    }
});

// Close modal when clicking outside of it (on the dark overlay)
window.addEventListener('click', function(event) {
    if (event.target === serviceModal) {
        serviceModal.style.display = 'none';
    }
    if (event.target === doctorModal) {
        doctorModal.style.display = 'none';
    }
});
