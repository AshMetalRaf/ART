// tabs function
const tabs = document.querySelectorAll('.tab');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

let currentFileName = "";

// file processing 
const dragArea = document.getElementById('dragArea');
const fileInput = document.getElementById('fileInput');

dragArea.addEventListener('click', () => fileInput.click());
dragArea.addEventListener('dragover', (e) => e.preventDefault());
dragArea.addEventListener('drop', (e) => {
    e.preventDefault();
    processFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', (e) => processFile(e.target.files[0]));

let fullFileContent = [];

function processFile(file) {
    const fileErrorToast = document.getElementById('fileErrorToast');
    if (!file.name.endsWith('.txt')) {
        fileErrorToast.classList.add('show');
        setTimeout(() => {
            fileErrorToast.classList.remove('show');
        }, 2000);
        return;
    }

    currentFileName = file.name;
    document.getElementById('saveButton').style.display = 'block';
    document.getElementById('restoreButton').style.display = 'block';
    dragArea.style.display = 'none';
    document.querySelector('.tabs').style.display = 'flex';

    // read the file content
    const reader = new FileReader();
    reader.onload = function (e) {
        const content = e.target.result.split('\n').filter(line => line.trim() !== ''); // process non empty lines
        fullFileContent = content;
        populateList(content);
    };
    reader.readAsText(file);
}

function populateList(content) {
    const achievementsList = document.getElementById('sortable-achievements');
    const leaderboardsList = document.getElementById('sortable-leaderboards');
    achievementsList.innerHTML = '';
    leaderboardsList.innerHTML = '';

    content.forEach(line => {
        const li = document.createElement('li');
        li.setAttribute('data-original', line);

        const readablePart = extractReadablePart(line);

        // split here
        const colonIndex = readablePart.indexOf(':');
        const parts = colonIndex !== -1
            ? [readablePart.slice(0, colonIndex), readablePart.slice(colonIndex + 1)]
            : [readablePart];

        if (parts.length === 2) {
            const part1 = document.createElement('span');
            part1.textContent = parts[0];
            part1.classList.add('achievement-title');

            const part2 = document.createElement('span');
            part2.textContent = parts[1];
            part2.classList.add('achievement-description');

            const separator = document.createElement('span');
            separator.textContent = ' • ';
            separator.classList.add('separator');

            li.appendChild(part1);
            li.appendChild(separator);
            li.appendChild(part2);
        } else {
            li.textContent = readablePart;
            li.style.color = '#cc9900';
        }

        if (line.startsWith('111000')) {
            achievementsList.appendChild(li);
        } else if (line.startsWith('L111000')) {
            leaderboardsList.appendChild(li);
        }
    });

    new Sortable(achievementsList, {
        animation: 150,
        ghostClass: 'drag-ghost'
    });

    new Sortable(leaderboardsList, {
        animation: 150
    });

    document.getElementById('achievements').classList.add('active');
    document.getElementById('leaderboards').classList.remove('active');
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
            if (tripleColonIndex !== -1) {
                return removeQuotes(substringAfterFirstColon.substring(0, tripleColonIndex).trim());
            }

            const lastColonInDesc = substringAfterFirstColon.lastIndexOf(':');
            if (lastColonInDesc !== -1) {
                let desc = substringAfterFirstColon.substring(0, lastColonInDesc).trim();
                const firstColonInDesc = desc.indexOf(':');
                if (firstColonInDesc !== -1) {
                    desc = desc.substring(firstColonInDesc + 1).trim();
                }
                return removeQuotes(desc);
            }

            return removeQuotes(substringAfterFirstColon);
        }

        const parts = line.split(':');
        return removeQuotes(parts.slice(2).join(':').split(':::')[0].trim());
    }
}

function saveFile() {
    const achievementItems = document.querySelectorAll('#sortable-achievements li');
    const leaderboardItems = document.querySelectorAll('#sortable-leaderboards li');

    const achievements = Array.from(achievementItems).map(item => item.getAttribute('data-original'));
    const leaderboards = Array.from(leaderboardItems).map(item => item.getAttribute('data-original'));

    const newFileContent = [];
    let isAchievement = false;
    let isLeaderboard = false;

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

    const blob = new Blob([newFileContent.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName || 'reordered_achievements_and_leaderboards.txt'; // default name if no file loaded
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

const restoreButton = document.getElementById('restoreButton');
restoreButton.addEventListener('click', restoreOriginalOrder);

function restoreOriginalOrder() {
    populateList(fullFileContent);
    showToast();
}

function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}
