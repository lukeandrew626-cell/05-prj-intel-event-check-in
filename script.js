'use strict';

const STORAGE_KEY = 'intelSummitAttendance';
const ATTENDANCE_GOAL = 50;
const teams = {
  water: { name: 'Team Water Wise', countElement: 'waterCount', cardClass: 'water' },
  zero: { name: 'Team Net Zero', countElement: 'zeroCount', cardClass: 'zero' },
  power: { name: 'Team Renewables', countElement: 'powerCount', cardClass: 'power' },
};

const form = document.getElementById('checkInForm');
const nameInput = document.getElementById('attendeeName');
const teamSelect = document.getElementById('teamSelect');
const greeting = document.getElementById('greeting');
const attendeeCount = document.getElementById('attendeeCount');
const progressBar = document.getElementById('progressBar');
const attendeeList = document.getElementById('attendeeList');
const emptyAttendeeMessage = document.getElementById('emptyAttendeeMessage');
const celebration = document.getElementById('celebration');
const celebrationMessage = document.getElementById('celebrationMessage');

let attendees = loadAttendees();

function loadAttendees() {
  try {
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(savedData)) return [];

    return savedData
      .filter((attendee) => attendee && typeof attendee.name === 'string' && teams[attendee.team])
      .map((attendee) => ({ name: attendee.name.trim(), team: attendee.team }))
      .filter((attendee) => attendee.name.length > 0);
  } catch (error) {
    // A missing or malformed saved value should start with an empty check-in list.
    return [];
  }
}

function saveAttendees() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attendees));
  } catch (error) {
    // The current session still works if browser storage is unavailable.
  }
}

function getTeamTotals() {
  const totals = { water: 0, zero: 0, power: 0 };
  attendees.forEach((attendee) => { totals[attendee.team] += 1; });
  return totals;
}

function updateCelebration(totals) {
  const goalReached = attendees.length >= ATTENDANCE_GOAL;
  celebration.hidden = !goalReached;
  document.querySelectorAll('.team-card').forEach((card) => card.classList.remove('winning-team'));

  if (!goalReached) return;

  const highestCount = Math.max(...Object.values(totals));
  const winningTeams = Object.keys(teams).filter((team) => totals[team] === highestCount);
  const teamNames = winningTeams.map((team) => teams[team].name);
  document.querySelectorAll('.team-card').forEach((card) => {
    const team = Object.keys(teams).find((key) => card.classList.contains(teams[key].cardClass));
    if (winningTeams.includes(team)) card.classList.add('winning-team');
  });

  const winnerText = teamNames.length > 1
    ? `The teams leading attendance are tied: ${teamNames.join(', ')}!`
    : `${teamNames[0]} has the highest attendance!`;
  celebrationMessage.textContent = `Congratulations, everyone! You reached the goal of ${ATTENDANCE_GOAL} attendees. ${winnerText}`;
}

function renderAttendees() {
  attendeeList.replaceChildren();
  emptyAttendeeMessage.hidden = attendees.length > 0;

  attendees.forEach((attendee) => {
    const item = document.createElement('li');
    const name = document.createElement('span');
    const team = document.createElement('span');
    item.className = 'attendee-item';
    name.className = 'attendee-name';
    team.className = 'attendee-team';
    name.textContent = attendee.name;
    team.textContent = teams[attendee.team].name;
    item.append(name, team);
    attendeeList.append(item);
  });
}

function renderAttendance() {
  const totals = getTeamTotals();
  attendeeCount.textContent = attendees.length;
  Object.keys(teams).forEach((team) => {
    document.getElementById(teams[team].countElement).textContent = totals[team];
  });
  const progress = Math.min((attendees.length / ATTENDANCE_GOAL) * 100, 100);
  progressBar.style.width = `${progress}%`;
  progressBar.setAttribute('aria-valuenow', String(Math.round(progress)));
  updateCelebration(totals);
  renderAttendees();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();
  const team = teamSelect.value;

  if (!name || !teams[team]) {
    if (!name) nameInput.focus();
    else teamSelect.focus();
    return;
  }

  attendees.push({ name, team });
  saveAttendees();
  renderAttendance();
  greeting.textContent = `Welcome to the Intel Sustainability Summit, ${name}! You're checked in with ${teams[team].name}!`;
  greeting.classList.add('success-message');
  greeting.style.display = 'block';
  form.reset();
});

renderAttendance();
