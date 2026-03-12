/*
  Simple productivity app:
  - Greeting + current date/time
  - 25-minute focus timer (start/stop/reset)
  - Todo list (add/edit/delete/complete)
  - Quick links (saved in Local Storage)
*/

const STORAGE_KEYS = {
  tasks: 'quick-tasks-v1',
  links: 'quick-links-v1',
};

const SELECTORS = {
  clock: 'currentTime',
  date: 'currentDate',
  greeting: 'greeting',
  timer: 'timerDisplay',
  startBtn: 'timerStart',
  stopBtn: 'timerStop',
  resetBtn: 'timerReset',
  timerStatus: 'timerStatus',

  taskInput: 'taskInput',
  taskAddBtn: 'taskAdd',
  tasksList: 'taskList',
  tasksEmpty: 'tasksEmpty',

  linkName: 'linkName',
  linkUrl: 'linkUrl',
  linkAddBtn: 'linkAdd',
  linksList: 'linksList',
  linksEmpty: 'linksEmpty',
};

const TIMER = {
  defaultSeconds: 25 * 60,
  remaining: 25 * 60,
  intervalId: null,
  running: false,
};

let tasks = [];
let links = [];

function $(id) {
  return document.getElementById(id);
}

function formatDigits(value) {
  return String(value).padStart(2, '0');
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${formatDigits(m)}:${formatDigits(s)}`;
}

function formatTimeString(date) {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDateString(date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getGreeting(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function triggerLightning() {
  const clockEl = $(SELECTORS.clock);
  if (!clockEl) return;
  clockEl.classList.add('flash');
  clockEl.addEventListener(
    'animationend',
    () => clockEl.classList.remove('flash'),
    { once: true }
  );
}

function updateClock() {
  const now = new Date();
  $(SELECTORS.clock).textContent = formatTimeString(now);
  $(SELECTORS.date).textContent = formatDateString(now);
  $(SELECTORS.greeting).textContent = `${getGreeting(now.getHours())}!`;
}

function renderTimer() {
  $(SELECTORS.timer).textContent = formatTime(TIMER.remaining);
  $(SELECTORS.timerStatus).textContent = TIMER.running ? 'Running' : 'Paused';
  $(SELECTORS.startBtn).disabled = TIMER.running;
  $(SELECTORS.stopBtn).disabled = !TIMER.running;
}

function tickTimer() {
  if (TIMER.remaining <= 0) {
    stopTimer();
    $(SELECTORS.timerStatus).textContent = 'Time is up!';
    return;
  }
  TIMER.remaining -= 1;
  renderTimer();
}

function startTimer() {
  if (TIMER.running) return;
  TIMER.running = true;
  TIMER.intervalId = setInterval(tickTimer, 1000);
  renderTimer();
}

function stopTimer() {
  if (!TIMER.running) return;
  TIMER.running = false;
  clearInterval(TIMER.intervalId);
  TIMER.intervalId = null;
  renderTimer();
}

function resetTimer() {
  stopTimer();
  TIMER.remaining = TIMER.defaultSeconds;
  renderTimer();
}

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn('Failed to load from storage:', key, error);
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save to storage:', key, error);
  }
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/* ---------- Tasks ---------- */
function loadTasks() {
  tasks = loadFromStorage(STORAGE_KEYS.tasks, []);
}

function saveTasks() {
  saveToStorage(STORAGE_KEYS.tasks, tasks);
}

function renderTasks() {
  const list = $(SELECTORS.tasksList);
  list.innerHTML = '';

  if (!tasks.length) {
    $(SELECTORS.tasksEmpty).hidden = false;
    return;
  }

  $(SELECTORS.tasksEmpty).hidden = true;

  tasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = 'item';

    const label = document.createElement('label');
    label.className = 'item__label';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.className = 'item__checkbox';
    checkbox.addEventListener('change', () => {
      task.done = checkbox.checked;
      saveTasks();
      renderTasks();
    });

    const text = document.createElement('p');
    text.className = 'item__text';
    text.textContent = task.text;
    if (task.done) text.classList.add('completed');

    const actions = document.createElement('div');
    actions.className = 'item__actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.title = 'Edit task';
    editBtn.className = 'item__btn';
    editBtn.textContent = '✎';
    editBtn.addEventListener('click', () => {
      openTaskEditor(task, text, editBtn);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.title = 'Delete task';
    deleteBtn.className = 'item__btn item__btn--danger';
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', () => {
      tasks = tasks.filter((t) => t.id !== task.id);
      saveTasks();
      renderTasks();
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    label.appendChild(checkbox);
    label.appendChild(text);
    item.appendChild(label);
    item.appendChild(actions);
    list.appendChild(item);
  });
}

function openTaskEditor(task, textElement, editButton) {
  const parent = textElement.parentElement;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = task.text;
  input.className = 'item__text';
  input.style.flex = '1';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.textContent = 'Save';
  saveBtn.className = 'button button--secondary';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.className = 'button button--secondary';

  const actionsWrapper = document.createElement('div');
  actionsWrapper.className = 'item__actions';
  actionsWrapper.appendChild(saveBtn);
  actionsWrapper.appendChild(cancelBtn);

  const item = parent.parentElement;
  item.replaceChild(input, textElement);
  item.replaceChild(actionsWrapper, item.querySelector('.item__actions'));

  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);

  function closeEditor() {
    renderTasks();
  }

  saveBtn.addEventListener('click', () => {
    const newText = input.value.trim();
    if (!newText) return;
    task.text = newText;
    saveTasks();
    closeEditor();
  });

  cancelBtn.addEventListener('click', closeEditor);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      saveBtn.click();
    }
    if (event.key === 'Escape') {
      cancelBtn.click();
    }
  });
}

function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  tasks.unshift({
    id: createId(),
    text: trimmed,
    done: false,
  });
  saveTasks();
  renderTasks();
}

/* ---------- Quick Links ---------- */
function loadLinks() {
  links = loadFromStorage(STORAGE_KEYS.links, []);
}

function saveLinks() {
  saveToStorage(STORAGE_KEYS.links, links);
}

function renderLinks() {
  const list = $(SELECTORS.linksList);
  list.innerHTML = '';

  if (!links.length) {
    $(SELECTORS.linksEmpty).hidden = false;
    return;
  }

  $(SELECTORS.linksEmpty).hidden = true;

  links.forEach((link) => {
    const item = document.createElement('li');
    item.className = 'item';

    const label = document.createElement('div');
    label.className = 'item__label';

    const linkButton = document.createElement('button');
    linkButton.className = 'link-button';
    linkButton.textContent = link.name;
    linkButton.addEventListener('click', () => {
      window.open(link.url, '_blank', 'noopener');
    });

    const actions = document.createElement('div');
    actions.className = 'item__actions';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.title = 'Delete link';
    deleteBtn.className = 'item__btn item__btn--danger';
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', () => {
      links = links.filter((l) => l.id !== link.id);
      saveLinks();
      renderLinks();
    });

    actions.appendChild(deleteBtn);

    label.appendChild(linkButton);
    item.appendChild(label);
    item.appendChild(actions);
    list.appendChild(item);
  });
}

function addLink(name, url) {
  const nameTrimmed = name.trim();
  const urlTrimmed = url.trim();
  if (!nameTrimmed || !urlTrimmed) return;

  const normalizedUrl = urlTrimmed.match(/^https?:\/\//i)
    ? urlTrimmed
    : `https://${urlTrimmed}`;

  links.unshift({
    id: createId(),
    name: nameTrimmed,
    url: normalizedUrl,
  });

  saveLinks();
  renderLinks();
}

/* ---------- Initialization ---------- */
function activateButtonEffect(button) {
  if (!button) return;
  button.classList.add('pop');
  button.addEventListener(
    'animationend',
    () => button.classList.remove('pop'),
    { once: true }
  );
}

function setUpEventListeners() {
  $(SELECTORS.taskAddBtn).addEventListener('click', () => {
    const input = $(SELECTORS.taskInput);
    addTask(input.value);
    input.value = '';
    $(SELECTORS.taskAddBtn).disabled = true;
    input.focus();
  });

  $(SELECTORS.taskInput).addEventListener('input', (event) => {
    $(SELECTORS.taskAddBtn).disabled = !event.target.value.trim();
  });

  $(SELECTORS.linkAddBtn).addEventListener('click', () => {
    addLink($(SELECTORS.linkName).value, $(SELECTORS.linkUrl).value);
    $(SELECTORS.linkName).value = '';
    $(SELECTORS.linkUrl).value = '';
    $(SELECTORS.linkAddBtn).disabled = true;
    $(SELECTORS.linkName).focus();
  });

  const linkInputs = [$(SELECTORS.linkName), $(SELECTORS.linkUrl)];
  linkInputs.forEach((input) => {
    input.addEventListener('input', () => {
      $(SELECTORS.linkAddBtn).disabled = !(
        linkInputs[0].value.trim() && linkInputs[1].value.trim()
      );
    });
  });

  $(SELECTORS.startBtn).addEventListener('click', (event) => {
    activateButtonEffect(event.currentTarget);
    startTimer();
  });

  $(SELECTORS.stopBtn).addEventListener('click', (event) => {
    activateButtonEffect(event.currentTarget);
    stopTimer();
  });

  $(SELECTORS.resetBtn).addEventListener('click', (event) => {
    activateButtonEffect(event.currentTarget);
    resetTimer();
  });

  $(SELECTORS.clock).addEventListener('click', () => {
    triggerLightning();
  });
}

function init() {
  updateClock();
  setInterval(updateClock, 1000);

  loadTasks();
  loadLinks();

  renderTasks();
  renderLinks();
  renderTimer();

  setUpEventListeners();
}

document.addEventListener('DOMContentLoaded', init);
