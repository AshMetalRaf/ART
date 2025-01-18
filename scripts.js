// Tab Navigation Functionality
const tabs = document.querySelectorAll('.tab');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Activate the clicked tab and deactivate others
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Show the corresponding tab content
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

// Global Variable to store the current file name
let currentFileName = "";

// File Processing Elements
const dragArea = document.getElementById('dragArea');
const fileInput = document.getElementById('fileInput');

// Event Listener for Drag and Drop and Click to Open File Dialog
dragArea.addEventListener('click', () => fileInput.click());
dragArea.addEventListener('dragover', (e) => e.preventDefault());
dragArea.addEventListener('drop', (e) => {
    e.preventDefault();
    processFile(e.dataTransfer.files[0]);
});

// Event Listener for File Input Change
fileInput.addEventListener('change', (e) => processFile(e.target.files[0]));

// Global variable to store the entire file content
let fullFileContent = [];

// Process Uploaded File
function processFile(file) {
    if (!file.name.endsWith('.txt')) {
        alert('Please upload a valid .txt file.');
        return;
    }

    currentFileName = file.name; // Store the file name
    document.getElementById('saveButton').style.display = 'block'; // Show the save button
    dragArea.style.display = 'none'; // Hide the drag area
    document.querySelector('.tabs').style.display = 'flex'; // Show the tab navigation

    // Read the content of the file
    const reader = new FileReader();
    reader.onload = function (e) {
        const content = e.target.result.split('\n').filter(line => line.trim() !== ''); // Process non-empty lines
        fullFileContent = content;  // Store the entire file content
        populateList(content); // Populate the lists with the content
    };
    reader.readAsText(file); // This reads the file as text
}

// Populate the Achievements and Leaderboards Lists
function populateList(content) {
    const achievementsList = document.getElementById('sortable-achievements');
    const leaderboardsList = document.getElementById('sortable-leaderboards');
    achievementsList.innerHTML = '';
    leaderboardsList.innerHTML = '';

    content.forEach(line => {
        const li = document.createElement('li');
        li.setAttribute('data-original', line);

        // Extract the readable part of the line
        const readablePart = extractReadablePart(line);

        // Split the readable part into two parts
        const parts = readablePart.split(':');

        if (parts.length === 2) {
            // Span for each part with different colors
            const part1 = document.createElement('span');
            part1.textContent = parts[0];  // Title
            part1.style.color = '#cc9900';

            const part2 = document.createElement('span');
            part2.textContent = parts[1];  // Description
            part2.style.color = '#2c97fa';

            // Span for the separator with its own color
            const separator = document.createElement('span');
            separator.textContent = ' • ';  // Adjust separator as needed
            separator.style.color = '#aaaaaa';

            // Append parts and separator to the list item
            li.appendChild(part1);
            li.appendChild(separator);
            li.appendChild(part2);
        } else {
            // If there's only one part, just apply a single color
            li.textContent = readablePart;
            li.style.color = '#cc9900';  // Apply a color if there's only one part
        }

        if (line.startsWith('111000')) {
            achievementsList.appendChild(li);
        } else if (line.startsWith('L111000')) {
            leaderboardsList.appendChild(li);
        }
    });

    // Create sortable for achievements
    new Sortable(achievementsList, {
        animation: 150,
        ghostClass: 'drag-ghost'
    });

    // Create sortable for leaderboards
    new Sortable(leaderboardsList, {
        animation: 150
    });

    // Set the "Achievements" tab as active by default
    document.getElementById('achievements').classList.add('active');
    document.getElementById('leaderboards').classList.remove('active');
}

// Function to generate a random color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Extract the readable part of a line
function extractReadablePart(line) {
    const lastColonIndex = line.lastIndexOf('":');
    if (lastColonIndex !== -1) {
        const substringAfterLastColon = line.substring(lastColonIndex + 2).trim();
        const firstTripleColonIndex = substringAfterLastColon.indexOf(':::');
        if (firstTripleColonIndex !== -1) {
            return substringAfterLastColon.substring(0, firstTripleColonIndex).trim();
        }

        const lastColonInDescription = substringAfterLastColon.lastIndexOf(':');
        if (lastColonInDescription !== -1) {
            let description = substringAfterLastColon.substring(0, lastColonInDescription).trim();
            const colonIndex = description.indexOf(':');
            if (colonIndex !== -1) {
                description = description.substring(colonIndex + 1).trim();
            }
            return description;
        }
        return substringAfterLastColon;
    }

    const parts = line.split(':');
    return parts.slice(2).join(':').split(':::')[0].trim(); // Default logic
}

// Modal Event Handlers
document.getElementById('readmeButton').addEventListener('click', showReadmeModal);
document.querySelector('.close').addEventListener('click', closeReadmeModal);
window.addEventListener('click', closeModalOnOutsideClick);

// Show Readme Modal
function showReadmeModal() {
    document.getElementById('readmeModal').style.display = 'block';
}

// Close Readme Modal
function closeReadmeModal() {
    document.getElementById('readmeModal').style.display = 'none';
}

// Close Modal when Clicking Outside
function closeModalOnOutsideClick(event) {
    if (event.target === document.getElementById('readmeModal')) {
        closeReadmeModal();
    }
}

// Save Reordered List
function saveFile() {
    const achievementItems = document.querySelectorAll('#sortable-achievements li');
    const leaderboardItems = document.querySelectorAll('#sortable-leaderboards li');

    const achievements = Array.from(achievementItems).map(item => item.getAttribute('data-original'));
    const leaderboards = Array.from(leaderboardItems).map(item => item.getAttribute('data-original'));

    const newFileContent = [];
    let isAchievement = false;
    let isLeaderboard = false;

    // Rebuild the file content with the reordered sections
    fullFileContent.forEach(line => {
        if (line.startsWith('111000') && !isAchievement) {
            newFileContent.push(...achievements);
            isAchievement = true;
        }

        if (line.startsWith('L111000') && !isLeaderboard) {
            newFileContent.push(...leaderboards);
            isLeaderboard = true;
        }

        if (!line.startsWith('111000') && !line.startsWith('L111000')) {
            newFileContent.push(line);
        }
    });

    // Create a blob and trigger file download
    const blob = new Blob([newFileContent.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName || 'reordered_achievements_and_leaderboards.txt'; // Default name if no file loaded
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
// Changelog Modal Event Handlers
document.getElementById('changelogText').addEventListener('click', showChangelogModal);
document.getElementById('changelogClose').addEventListener('click', closeChangelogModal);

// Show Changelog Modal
function showChangelogModal() {
    document.getElementById('changelogModal').style.display = 'block';
}

// Close Changelog Modal
function closeChangelogModal() {
    document.getElementById('changelogModal').style.display = 'none';
}

// Close Modal when Clicking Outside
window.addEventListener('click', (event) => {
    const changelogModal = document.getElementById('changelogModal');
    if (event.target === changelogModal) {
        closeChangelogModal();
    }
});

// Function to toggle between Themes
const themeToggleButton = document.getElementById('theme-toggle');
const themeLink = document.getElementById('theme-stylesheet');  // Reference to the link tag for the stylesheet

themeToggleButton.addEventListener('click', function () {
    // Check the current theme and toggle the stylesheet link
    if (themeLink.getAttribute('href') === 'styles-theme-2.css') {
        themeLink.setAttribute('href', 'styles-theme-1.css'); // Switch to theme 1
    } else {
        themeLink.setAttribute('href', 'styles-theme-2.css'); // Switch to theme 2
    }
});
