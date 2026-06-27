// We use `initialTeams` which is loaded from data.js
let availableTeams = [];
let draftedResults = [];
let isDrafting = false;

// Load state from localStorage
function loadState() {
    const savedAvailable = localStorage.getItem('osm_draft_available');
    const savedResults = localStorage.getItem('osm_draft_results');
    
    if (savedAvailable) {
        availableTeams = JSON.parse(savedAvailable);
    } else {
        availableTeams = [...initialTeams];
    }
    
    if (savedResults) {
        draftedResults = JSON.parse(savedResults);
    }
}

function saveState() {
    localStorage.setItem('osm_draft_available', JSON.stringify(availableTeams));
    localStorage.setItem('osm_draft_results', JSON.stringify(draftedResults));
}

// Initialize state
loadState();

const playerNameInput = document.getElementById('playerName');
const drawBtn = document.getElementById('drawBtn');
const teamNameDisplay = document.getElementById('teamNameDisplay');
const teamFlagDisplay = document.getElementById('teamFlagDisplay');
const teamDisplayContainer = document.getElementById('teamDisplay');
const availableTeamsList = document.getElementById('availableTeamsList');
const availableCount = document.getElementById('availableCount');
const draftedList = document.getElementById('draftedList');
const toggleAvailableBtn = document.getElementById('toggleAvailableBtn');

// Settings Elements
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const addTeamBtn = document.getElementById('addTeamBtn');
const newTeamName = document.getElementById('newTeamName');
const newTeamFlag = document.getElementById('newTeamFlag');
const settingsTeamsList = document.getElementById('settingsTeamsList');
const resetTeamsBtn = document.getElementById('resetTeamsBtn');

let isAvailableVisible = true;

// Trigger draw on Enter key
playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        drawBtn.click();
    }
});

toggleAvailableBtn.addEventListener('click', () => {
    isAvailableVisible = !isAvailableVisible;
    if (isAvailableVisible) {
        availableTeamsList.style.display = 'flex';
        toggleAvailableBtn.textContent = 'Hide';
    } else {
        availableTeamsList.style.display = 'none';
        toggleAvailableBtn.textContent = 'Show';
    }
});

function getFlagUrl(code) {
    if (!code) return '';
    return `https://flagcdn.com/w160/${code}.png`;
}

function updateUI() {
    // 1. Update available teams compact list
    availableTeamsList.innerHTML = '';
    availableCount.textContent = availableTeams.length;
    
    availableTeams.forEach(team => {
        const div = document.createElement('div');
        div.className = 'compact-team';
        
        const img = document.createElement('img');
        img.src = getFlagUrl(team.flag);
        
        const span = document.createElement('span');
        span.textContent = team.name;
        
        div.appendChild(img);
        div.appendChild(span);
        availableTeamsList.appendChild(div);
    });

    if(availableTeams.length === 0) {
        document.querySelector('.small-available-teams').style.display = 'none';
    } else {
        document.querySelector('.small-available-teams').style.display = 'block';
    }

    // 2. Update drafted results list
    draftedList.innerHTML = '';
    draftedResults.forEach(result => {
        const li = document.createElement('li');
        li.className = 'drafted-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'player-name';
        nameSpan.textContent = result.name;

        const teamInfoDiv = document.createElement('div');
        teamInfoDiv.className = 'team-info';

        const teamSpan = document.createElement('span');
        teamSpan.className = 'team-name';
        teamSpan.textContent = result.team.name;

        const flagImg = document.createElement('img');
        flagImg.className = 'team-flag';
        flagImg.src = getFlagUrl(result.team.flag);

        teamInfoDiv.appendChild(teamSpan);
        teamInfoDiv.appendChild(flagImg);

        li.appendChild(nameSpan);
        li.appendChild(teamInfoDiv);
        draftedList.appendChild(li);
    });

    // 3. Update button
    if (availableTeams.length === 0) {
        drawBtn.disabled = true;
        drawBtn.textContent = 'All Teams Drafted';
        playerNameInput.disabled = true;
    } else {
        drawBtn.disabled = false;
        drawBtn.textContent = 'Submit / Draw';
        playerNameInput.disabled = false;
    }
}

function startDraftAnimation(finalTeam, callback) {
    let ticks = 0;
    const maxTicks = 25; 
    const speed = 100; 

    teamFlagDisplay.style.display = 'block'; 

    const interval = setInterval(() => {
        const randomTeam = availableTeams[Math.floor(Math.random() * availableTeams.length)] || finalTeam;
        
        teamNameDisplay.textContent = randomTeam.name;
        teamFlagDisplay.src = getFlagUrl(randomTeam.flag);
        teamDisplayContainer.style.transform = `scale(${1 + Math.random() * 0.05})`;

        ticks++;
        if (ticks >= maxTicks) {
            clearInterval(interval);
            teamDisplayContainer.style.transform = 'scale(1.15)';
            teamNameDisplay.style.color = '#fff';
            teamNameDisplay.textContent = finalTeam.name;
            teamFlagDisplay.src = getFlagUrl(finalTeam.flag);
            
            setTimeout(() => {
                teamDisplayContainer.style.transform = 'scale(1)';
                teamNameDisplay.style.color = 'var(--bg-color)';
                callback();
            }, 600);
        }
    }, speed);
}

drawBtn.addEventListener('click', () => {
    const playerName = playerNameInput.value.trim();

    if (!playerName) {
        alert('Please enter your name first!');
        return;
    }

    if (availableTeams.length === 0) {
        alert('No more teams available!');
        return;
    }

    if (isDrafting) return;

    isDrafting = true;
    drawBtn.disabled = true;
    playerNameInput.disabled = true;

    const randomIndex = Math.floor(Math.random() * availableTeams.length);
    const selectedTeam = availableTeams[randomIndex];

    availableTeams.splice(randomIndex, 1);

    startDraftAnimation(selectedTeam, () => {
        draftedResults.push({ name: playerName, team: selectedTeam });
        playerNameInput.value = ''; 
        
        saveState(); // Save after drafting
        updateUI(); 
        
        isDrafting = false;
        if (availableTeams.length > 0) {
            playerNameInput.focus();
        }
    });
});

/* --- Settings Modal Logic --- */

// Open Settings
settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'flex';
    renderSettingsTeams();
});

// Close Settings
closeSettingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

// Render teams in settings list
function renderSettingsTeams() {
    settingsTeamsList.innerHTML = '';
    availableTeams.forEach((team, index) => {
        const li = document.createElement('li');
        
        const leftDiv = document.createElement('div');
        leftDiv.className = 'settings-team-info';
        
        const img = document.createElement('img');
        img.src = getFlagUrl(team.flag);
        
        const span = document.createElement('span');
        span.textContent = team.name;

        leftDiv.appendChild(img);
        leftDiv.appendChild(span);

        const delBtn = document.createElement('button');
        delBtn.textContent = '❌';
        delBtn.className = 'delete-btn';
        delBtn.title = 'Remove Team';
        delBtn.onclick = () => {
            availableTeams.splice(index, 1);
            saveState();
            renderSettingsTeams();
            updateUI();
        };

        li.appendChild(leftDiv);
        li.appendChild(delBtn);
        settingsTeamsList.appendChild(li);
    });
}

// Add new team
addTeamBtn.addEventListener('click', () => {
    const name = newTeamName.value.trim();
    const flag = newTeamFlag.value.trim().toLowerCase();
    
    if (name && flag) {
        availableTeams.push({ name, flag });
        newTeamName.value = '';
        newTeamFlag.value = '';
        saveState();
        renderSettingsTeams();
        updateUI();
    } else {
        alert('Please provide both a Team Name and a Flag Code (e.g. dz).');
    }
});

// Reset to default
resetTeamsBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all teams to the default list and clear the current draft results?')) {
        availableTeams = [...initialTeams];
        draftedResults = [];
        saveState();
        renderSettingsTeams();
        updateUI();
    }
});

// Initial UI setup on page load
updateUI();
