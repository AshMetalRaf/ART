// hide ui stuff until file is loaded
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.action-buttons').classList.add('initial-hidden');
    document.querySelector('.tabs').classList.add('initial-hidden');
    document.getElementById('achievements').classList.add('initial-hidden');
    document.getElementById('leaderboards').classList.add('initial-hidden');
});

// tab switching
const tabs = document.querySelectorAll('.tab');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => content.classList.add('hidden'));
        document.getElementById(tab.dataset.tab).classList.remove('hidden');
    });
});

let currentFileName = "";
const fileInput = document.getElementById('artFileInput');
let fullFileContent = [];

// file upload
fileInput.addEventListener('change', e => {
    if (e.target.files.length > 0) processFile(e.target.files[0]);
});

// read and process the selected file
function processFile(file) {
    const fileErrorToast = document.getElementById('fileErrorToast');
    if (!file.name.endsWith('.txt')) {
        fileErrorToast.classList.add('show');
        setTimeout(() => fileErrorToast.classList.remove('show'), 2000);
        return;
    }
    currentFileName = file.name;
    document.querySelector('.action-buttons').classList.remove('initial-hidden');
    document.querySelector('.tabs').classList.remove('initial-hidden');
    document.getElementById('achievements').classList.remove('initial-hidden');
    document.getElementById('leaderboards').classList.remove('initial-hidden');
    document.querySelectorAll('.list-header').forEach(h => h.style.display = 'grid');
    document.getElementById('achievements').classList.remove('hidden');
    document.getElementById('leaderboards').classList.add('hidden');

    const reader = new FileReader();
    reader.onload = e => {
        const content = e.target.result.split('\n').filter(line => line.trim() !== '');
        fullFileContent = content;
        populateList(content);
    };
    reader.readAsText(file);
}

// populate the list
function populateList(content) {
    const achievementsList = document.getElementById('sortable-achievements');
    const leaderboardsList = document.getElementById('sortable-leaderboards');
    achievementsList.innerHTML = '';
    leaderboardsList.innerHTML = '';

    let achievementCounter = 1;
    let leaderboardCounter = 1;

    content.forEach(line => {
        const li = document.createElement('li');
        li.setAttribute('data-original', line);
        li.classList.add('list-item');
        const readablePart = extractReadablePart(line);

        const colonIndex = readablePart.indexOf(':');
        const parts = colonIndex !== -1 ? [readablePart.slice(0, colonIndex), readablePart.slice(colonIndex + 1)] : [readablePart];

        if (parts.length === 2) {
            const wrapper = document.createElement('div');
            wrapper.classList.add('achievement-row');
            const numberSpan = document.createElement('span');
            numberSpan.classList.add('achievement-number');
            const part1 = document.createElement('span');
            part1.textContent = parts[0];
            part1.classList.add('achievement-title');
            const part2 = document.createElement('span');
            part2.textContent = parts[1];
            part2.classList.add('achievement-description');
            wrapper.appendChild(numberSpan);
            wrapper.appendChild(part1);
            wrapper.appendChild(part2);
            li.appendChild(wrapper);

            if (line.startsWith('111000')) {
                numberSpan.textContent = achievementCounter++;
            } else if (line.startsWith('L111000')) {
                numberSpan.textContent = leaderboardCounter++;
            }
        } else {
            li.textContent = readablePart;
            li.style.color = '#cc9900';
        }

        if (line.startsWith('111000')) achievementsList.appendChild(li);
        else if (line.startsWith('L111000')) leaderboardsList.appendChild(li);
    });

    new Sortable(achievementsList, { animation: 150, ghostClass: 'drag-ghost' });
    new Sortable(leaderboardsList, { animation: 150 });

    document.getElementById('achievements').classList.remove('hidden');
    document.getElementById('leaderboards').classList.add('hidden');
}

// extract the readable line part
function removeQuotes(str) {
    return str.replace(/"/g, '').trim();
}

function extractReadablePart(line) {
    if (line.startsWith('L111000')) {
        const parts = line.split(':');
        const title = removeQuotes(parts[parts.length - 3] || '');
        const description = removeQuotes(parts[parts.length - 2] || '');
        return title + ': ' + description;
    } else {
        const firstQuoteColonIndex = line.indexOf('":');
        if (firstQuoteColonIndex !== -1) {
            const substringAfterFirstColon = line.substring(firstQuoteColonIndex + 2).trim();
            const tripleColonIndex = substringAfterFirstColon.indexOf(':::');
            if (tripleColonIndex !== -1) return removeQuotes(substringAfterFirstColon.substring(0, tripleColonIndex).trim());
            const lastColonInDesc = substringAfterFirstColon.lastIndexOf(':');
            if (lastColonInDesc !== -1) {
                let desc = substringAfterFirstColon.substring(0, lastColonInDesc).trim();
                const firstColonInDesc = desc.indexOf(':');
                if (firstColonInDesc !== -1) desc = desc.substring(firstColonInDesc + 1).trim();
                return removeQuotes(desc);
            }
            return removeQuotes(substringAfterFirstColon);
        }
        const parts = line.split(':');
        return removeQuotes(parts.slice(2).join(':').split(':::')[0].trim());
    }
}

// save the reordered file
function saveFile() {
    const achievementItems = document.querySelectorAll('#sortable-achievements li');
    const leaderboardItems = document.querySelectorAll('#sortable-leaderboards li');
    const achievements = Array.from(achievementItems).map(item => item.getAttribute('data-original'));
    const leaderboards = Array.from(leaderboardItems).map(item => item.getAttribute('data-original'));
    const newFileContent = [];
    let isAchievement = false, isLeaderboard = false;

    fullFileContent.forEach(line => {
        if (line.startsWith('111000') && !isAchievement) {
            newFileContent.push(...achievements);
            isAchievement = true;
        }
        if (line.startsWith('L111000') && !isLeaderboard) {
            newFileContent.push(...leaderboards);
            isLeaderboard = true;
        }
        if (!line.startsWith('111000') && !line.startsWith('L111000')) newFileContent.push(line);
    });

    const blob = new Blob([newFileContent.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName || 'reordered_achievements_and_leaderboards.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// toast and restore msgs down here
const restoreButton = document.getElementById('restoreButton');
restoreButton.addEventListener('click', restoreOriginalOrder);
function restoreOriginalOrder() {
    populateList(fullFileContent);
    showToast();
}

function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}