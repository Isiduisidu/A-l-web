// State
let videos = JSON.parse(localStorage.getItem('al_portal_videos')) || [];
let currentSubject = 'all';

// DOM Elements
const videoGrid = document.getElementById('videoGrid');
const navLinks = document.querySelectorAll('.nav-links li');
const pageTitle = document.getElementById('page-title');

// Modals
const addModal = document.getElementById('addModal');
const playerModal = document.getElementById('playerModal');
const openModalBtn = document.getElementById('openModalBtn');
const closeAddModalBtn = document.getElementById('closeModalBtn');
const closePlayerBtn = document.getElementById('closePlayerBtn');

// Form
const addVideoForm = document.getElementById('addVideoForm');
const videoSubject = document.getElementById('videoSubject');
const videoTitle = document.getElementById('videoTitle');
const videoUrl = document.getElementById('videoUrl');

// Player
const youtubePlayer = document.getElementById('youtubePlayer');
const playerTitle = document.getElementById('playerTitle');

// Subject Configurations
const subjectsInfo = {
    all: { name: 'සියලුම පාඩම් (All Lessons)', key: 'all' },
    geography: { name: 'භූගෝල විද්‍යාව (Geography)', key: 'geography' },
    media: { name: 'සන්නිවේදනය හා මාධ්‍ය අධ්‍යයනය (Media)', key: 'media' },
    sinhala: { name: 'සිංහල (Sinhala)', key: 'sinhala' }
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    renderVideos();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            currentSubject = link.dataset.subject;
            pageTitle.textContent = subjectsInfo[currentSubject].name;
            renderVideos();
        });
    });

    // Modal Actions
    openModalBtn.addEventListener('click', () => {
        addModal.classList.add('active');
        if (currentSubject !== 'all') {
            videoSubject.value = currentSubject;
        }
    });

    closeAddModalBtn.addEventListener('click', () => {
        addModal.classList.remove('active');
        addVideoForm.reset();
    });

    closePlayerBtn.addEventListener('click', () => {
        playerModal.classList.remove('active');
        youtubePlayer.src = ''; // Stop playing when closed
    });

    // Close on overlay click
    window.addEventListener('click', (e) => {
        if (e.target === addModal) {
            addModal.classList.remove('active');
            addVideoForm.reset();
        }
        if (e.target === playerModal) {
            playerModal.classList.remove('active');
            youtubePlayer.src = '';
        }
    });

    // Form Submit
    addVideoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const subject = videoSubject.value;
        const title = videoTitle.value;
        const url = videoUrl.value;
        
        const videoId = extractYouTubeID(url);
        
        if (!videoId) {
            showToast('කරුණාකර නිවැරදි YouTube ලින්ක් එකක් ලබා දෙන්න (Please enter a valid YouTube link)', 'error');
            return;
        }

        const newVideo = {
            id: Date.now().toString(),
            subject,
            title,
            videoId,
            dateAdded: new Date().toISOString()
        };

        videos.push(newVideo);
        saveVideos();
        renderVideos();
        
        addModal.classList.remove('active');
        addVideoForm.reset();
        showToast('වීඩියෝව සාර්ථකව එක් කරන ලදී (Video successfully added!)');
    });
}

// Extract YouTube Video ID
function extractYouTubeID(url) {
    // Advanced regex to handle unlisted, live, shorts, and URLs with tracking parameters
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=|live\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regExp);
    return (match && match[1]) ? match[1] : false;
}

// Render Videos
function renderVideos() {
    videoGrid.innerHTML = '';
    
    let filteredVideos = videos;
    if (currentSubject !== 'all') {
        filteredVideos = videos.filter(v => v.subject === currentSubject);
    }
    
    // Sort by date added (newest first)
    filteredVideos.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

    if (filteredVideos.length === 0) {
        videoGrid.innerHTML = `
            <div class="empty-state">
                <i class='bx bx-video-off'></i>
                <p>මෙම විෂයට අදාළ වීඩියෝ කිසිවක් මෙතෙක් එක් කර නොමැත.</p>
                <p style="font-size:0.9rem; margin-top:0.5rem; opacity:0.7">නව වීඩියෝවක් එක් කිරීමට ඉහළ ඇති බොත්තම භාවිත කරන්න.</p>
            </div>
        `;
        return;
    }

    filteredVideos.forEach(video => {
        const card = document.createElement('div');
        card.className = 'video-card';
        
        const subjectClass = 'subject-' + video.subject;
        const subjectName = subjectsInfo[video.subject].name.split(' (')[0]; // Get Sinhala name

        const thumbnailImg = 'https://img.youtube.com/vi/' + video.videoId + '/hqdefault.jpg';
        
        card.innerHTML = `
            <div class="thumbnail-wrapper" onclick="playVideo('${video.id}')">
                <img src="${thumbnailImg}" alt="${video.title}" class="thumbnail">
                <div class="play-overlay">
                    <i class='bx bx-play-circle'></i>
                </div>
            </div>
            <div class="card-content">
                <span class="subject-badge ${subjectClass}">${subjectName}</span>
                <h3 class="video-title" onclick="playVideo('${video.id}')">${video.title}</h3>
                <div class="card-actions">
                    <button class="delete-btn" onclick="deleteVideo('${video.id}')" title="ඉවත් කරන්න (Delete)">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            </div>
        `;
        
        videoGrid.appendChild(card);
    });
}

// Play Video
window.playVideo = function(id) {
    const video = videos.find(v => v.id === id);
    if (!video) return;
    
    playerTitle.textContent = video.title;
    youtubePlayer.src = 'https://www.youtube.com/embed/' + video.videoId + '?autoplay=1';
    playerModal.classList.add('active');
};

// Delete Video
window.deleteVideo = function(id) {
    if(confirm('මෙම වීඩියෝව ඉවත් කිරීමට අවශ්‍ය බව ඔබට සහතිකද? (Are you sure you want to delete this video?)')) {
        videos = videos.filter(v => v.id !== id);
        saveVideos();
        renderVideos();
        showToast('වීඩියෝව ඉවත් කරන ලදී (Video deleted)');
    }
};

// Save to LocalStorage
function saveVideos() {
    localStorage.setItem('al_portal_videos', JSON.stringify(videos));
}

// Toast Notification System
function showToast(message, type = 'success') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    
    let icon = "<i class='bx bx-check-circle'></i>";
    if (type === 'error') {
        icon = "<i class='bx bx-error-circle' style='color: var(--danger)'></i>";
        toast.style.borderLeftColor = 'var(--danger)';
    }
    
    toast.innerHTML = icon + ' <span>' + message + '</span>';
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
