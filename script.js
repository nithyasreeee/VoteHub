const STORAGE_KEYS = {
  USERS: 'ovs_users',
  SESSION: 'ovs_session',
  POLLS: 'ovs_polls',
  VOTES: 'ovs_votes'
};

const DEFAULT_ADMIN = {
  id: 'admin-seed',
  name: 'Platform Admin',
  email: 'admin@votehub.com',
  password: 'admin123',
  role: 'admin'
};

function readJSON(key, fallback) {
  const value = localStorage.getItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUsers() {
  return readJSON(STORAGE_KEYS.USERS, []);
}

function setUsers(users) {
  saveJSON(STORAGE_KEYS.USERS, users);
}

function getSession() {
  return readJSON(STORAGE_KEYS.SESSION, null);
}

function setSession(user) {
  saveJSON(STORAGE_KEYS.SESSION, user);
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

function getPolls() {
  return readJSON(STORAGE_KEYS.POLLS, []);
}

function setPolls(polls) {
  saveJSON(STORAGE_KEYS.POLLS, polls);
}

function getVotes() {
  return readJSON(STORAGE_KEYS.VOTES, {});
}

function setVotes(votes) {
  saveJSON(STORAGE_KEYS.VOTES, votes);
}

function getVoteKey(email, pollId) {
  return `${email}__${pollId}`;
}

function normalizePollSettings(poll) {
  const mode = poll?.settings?.mode === 'multiple' ? 'multiple' : 'single';
  const optionCount = Array.isArray(poll?.options) ? poll.options.length : 0;

  if (mode === 'single') {
    return { mode: 'single', maxSelections: 1 };
  }

  const parsedMax = Number(poll?.settings?.maxSelections);
  const maxSelections = Number.isInteger(parsedMax) ? parsedMax : 2;
  return {
    mode: 'multiple',
    maxSelections: Math.min(Math.max(maxSelections, 2), Math.max(optionCount, 2))
  };
}

function ensureSeedData() {
  const users = getUsers();
  const adminIndex = users.findIndex((user) => user.email === DEFAULT_ADMIN.email);

  if (adminIndex === -1) {
    users.push(DEFAULT_ADMIN);
  } else {
    // Keep admin access controlled internally with canonical credentials.
    users[adminIndex] = { ...users[adminIndex], ...DEFAULT_ADMIN };
  }

  setUsers(users);
}

function ensureAuthRedirect(page) {
  const user = getSession();
  const protectedPages = ['dashboard', 'polls', 'admin'];

  if (protectedPages.includes(page) && !user) {
    window.location.href = 'login.html';
    return null;
  }

  if (page === 'admin' && user?.role !== 'admin') {
    window.location.href = 'dashboard.html';
    return null;
  }

  return user;
}

function navLinksForUser(user) {
  const common = [
    { label: 'Dashboard', href: 'dashboard.html', authOnly: true },
    { label: 'Poll Center', href: 'polls.html', authOnly: true },
    { label: 'Admin', href: 'admin.html', adminOnly: true }
  ];

  if (!user) {
    return [
      { label: 'Home', href: 'index.html' },
      { label: 'Login', href: 'login.html' },
      { label: 'Signup', href: 'signup.html' }
    ];
  }

  return [...common, { label: 'Logout', href: '#', isLogout: true, cta: true }];
}

function renderNavbar(page, user) {
  const host = document.getElementById('app-nav');
  if (!host) return;

  const links = navLinksForUser(user).filter((item) => {
    if (item.authOnly && !user) return false;
    if (item.adminOnly && user?.role !== 'admin') return false;
    return true;
  });

  host.innerHTML = `
    <header class="navbar">
      <div class="nav-inner">
        <a class="brand" href="${user ? 'dashboard.html' : 'index.html'}">
          <span class="brand-mark"></span>
          VoteHub
        </a>
        <button id="menuToggle" class="menu-toggle" aria-label="Toggle menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
        <nav id="navMenu" class="nav-menu">
          ${links
            .map((link) => {
              const active = link.href.includes(`${page}.html`) || (page === 'index' && link.href === 'index.html');
              const classes = `${link.cta ? 'nav-cta' : 'nav-link'} ${active ? 'active' : ''}`.trim();
              return `<a href="${link.href}" class="${classes}" ${link.isLogout ? 'id="logoutBtn"' : ''}>${link.label}</a>`;
            })
            .join('')}
        </nav>
      </div>
    </header>
  `;

  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');

  menuToggle?.addEventListener('click', () => {
    navMenu.classList.toggle('open');
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
  });

  document.getElementById('logoutBtn')?.addEventListener('click', (event) => {
    event.preventDefault();
    clearSession();
    window.location.href = 'login.html';
  });
}

function renderFooter() {
  const host = document.getElementById('app-footer');
  if (!host) return;

  host.innerHTML = `
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-grid">
          <div>
            <h4>About VoteHub</h4>
            <p>VoteHub enables secure, transparent, and modern online voting for communities and organizations.</p>
          </div>
          <div>
            <h4>Links</h4>
            <ul class="footer-links">
              <li><a href="index.html">Home</a></li>
              <li><a href="dashboard.html">Dashboard</a></li>
              <li><a href="polls.html">Poll Center</a></li>
              <li><a href="admin.html">Admin Panel</a></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <p>Email: support@votehub.app</p>
            <p>Phone: +91 9000222476 </p>
            <div class="social">
              <a href="#" aria-label="LinkedIn">Lin</a>
              <a href="#" aria-label="Instagram">Ins</a>
              <a href="#" aria-label="Dribbble">Red</a>
            </div>
          </div>
        </div>
        <div class="footer-copy">© ${new Date().getFullYear()} VoteHub. All rights reserved.</div>
      </div>
    </footer>
  `;
}

function setMessage(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = `form-message ${type}`;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return password.length >= 6;
}

function initSignupPage() {
  const form = document.getElementById('signupForm');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    if (name.length < 2) {
      setMessage('signupMessage', 'Please enter a valid name.', 'error');
      return;
    }
    if (!validateEmail(email)) {
      setMessage('signupMessage', 'Please enter a valid email address.', 'error');
      return;
    }
    if (!validatePassword(password)) {
      setMessage('signupMessage', 'Password must be at least 6 characters.', 'error');
      return;
    }

    const users = getUsers();
    if (users.some((user) => user.email === email)) {
      setMessage('signupMessage', 'An account already exists with this email.', 'error');
      return;
    }

    users.push({
      id: crypto.randomUUID(),
      name,
      email,
      password,
      role: 'user'
    });
    setUsers(users);

    setMessage('signupMessage', 'Signup successful. Redirecting to login...', 'success');
    form.reset();

    setTimeout(() => {
      window.location.href = 'login.html';
    }, 900);
  });
}

function initLoginPage() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    if (!validateEmail(email)) {
      setMessage('loginMessage', 'Please enter a valid email address.', 'error');
      return;
    }

    const users = getUsers();
    const user = users.find((item) => item.email === email);

    if (!user) {
      setMessage('loginMessage', 'User not found.', 'error');
      return;
    }

    if (user.password !== password) {
      setMessage('loginMessage', 'Invalid credentials.', 'error');
      return;
    }

    setSession({ id: user.id, name: user.name, email: user.email, role: user.role });
    setMessage('loginMessage', 'Login successful. Redirecting...', 'success');

    setTimeout(() => {
      window.location.href = email === DEFAULT_ADMIN.email ? 'admin.html' : 'dashboard.html';
    }, 700);
  });
}

function totalVotesInPoll(poll) {
  return poll.options.reduce((sum, option) => sum + option.votes, 0);
}

function initDashboardPage(user) {
  if (!user) return;

  const welcome = document.getElementById('welcomeTitle');
  if (welcome) {
    welcome.textContent = `Welcome back, ${user.name}`;
  }

  const polls = getPolls();
  const votes = getVotes();
  const userVoteCount = Object.keys(votes).filter((key) => key.startsWith(`${user.email}__`)).length;
  const activePolls = polls.filter((poll) => totalVotesInPoll(poll) === 0).length;
  const completedPolls = polls.filter((poll) => totalVotesInPoll(poll) > 0).length;

  document.getElementById('activePollsCount').textContent = String(activePolls);
  document.getElementById('completedPollsCount').textContent = String(completedPolls);
  document.getElementById('totalVotesCount').textContent = String(userVoteCount);
}

function createPieChart(poll) {
  const totalVotes = totalVotesInPoll(poll) || 1;
  const colors = ['#39b54b', '#2f943d', '#86d865', '#5fc36d', '#1f6f3c', '#52be80', '#76d7b8', '#6d9e6a'];
  
  let currentAngle = 0;
  const segments = poll.options.map((option, index) => {
    const percent = (option.votes / totalVotes) * 100;
    const sliceAngle = (option.votes / totalVotes) * 360;
    const color = colors[index % colors.length];
    
    const startAngleRad = (currentAngle * Math.PI) / 180;
    const endAngleRad = ((currentAngle + sliceAngle) * Math.PI) / 180;
    
    const x1 = 50 + 50 * Math.cos(startAngleRad);
    const y1 = 50 + 50 * Math.sin(startAngleRad);
    const x2 = 50 + 50 * Math.cos(endAngleRad);
    const y2 = 50 + 50 * Math.sin(endAngleRad);
    
    const largeArc = sliceAngle > 180 ? 1 : 0;
    const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`;
    
    const segment = {
      path: pathData,
      color: color,
      text: option.text,
      votes: option.votes,
      percent: Math.round(percent),
      angle: currentAngle,
      sliceAngle: sliceAngle
    };
    
    currentAngle += sliceAngle;
    return segment;
  });
  
  const svgContent = segments
    .map((segment, idx) => {
      return `
        <path 
          d="${segment.path}" 
          fill="${segment.color}" 
          class="pie-segment" 
          style="animation-delay: ${idx * 0.1}s"
          data-votes="${segment.votes}"
          data-text="${segment.text}"
          data-percent="${segment.percent}"
        />
      `;
    })
    .join('');
  
  return {
    svg: `
      <svg class="pie-chart" viewBox="0 0 100 100" width="200" height="200">
        ${svgContent}
      </svg>
    `,
    segments: segments,
    totalVotes: totalVotes
  };
}

function buildResultMarkup(poll) {
  const rawTotalVotes = totalVotesInPoll(poll);
  const totalVotes = rawTotalVotes || 1;
  const pieData = createPieChart(poll);

  return `
    <div class="result-block">
      <div class="results-container">
        <div class="pie-wrapper">
          ${pieData.svg}
          <p class="pie-center-text"><strong>${rawTotalVotes}</strong><br><small>votes</small></p>
        </div>
        <div class="results-list">
          ${poll.options
            .map((option, idx) => {
              const percent = Math.round((option.votes / totalVotes) * 100);
              const colors = ['#39b54b', '#2f943d', '#86d865', '#5fc36d', '#1f6f3c', '#52be80', '#76d7b8', '#6d9e6a'];
              const color = colors[idx % colors.length];
              return `
                <div class="result-row">
                  <div class="result-indicator" style="background: ${color}"></div>
                  <div class="result-label"><span>${option.text}</span><strong>${option.votes} (${percent}%)</strong></div>
                  <div class="progress"><span style="width:${percent}%; background: ${color}"></span></div>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    </div>
  `;
}

function buildAdminPollMarkup(poll) {
  const totalVotes = totalVotesInPoll(poll);

  return `
    <article class="card poll-card reveal admin-poll-card">
      <span class="status-pill admin">Admin Analytics</span>
      <h3>${poll.title}</h3>
      <p>${poll.description}</p>
      <p class="poll-total-votes"><strong>Total Votes:</strong> ${totalVotes}</p>
      <button class="btn btn-secondary admin-view-btn" type="button" data-view-results="${poll.id}">View Results</button>
      <section id="admin-results-${poll.id}" class="admin-results-panel" aria-hidden="true">
        ${buildResultMarkup(poll)}
      </section>
    </article>
  `;
}

function initPollsPage(user) {
  if (!user) return;

  const host = document.getElementById('pollList');
  const subtitle = document.querySelector('.page-header .section-subtitle');
  const polls = getPolls();
  const votes = getVotes();
  const isAdmin = user.role === 'admin';

  if (subtitle) {
    subtitle.textContent = isAdmin
      ? 'Review poll analytics and open detailed vote breakdowns.'
      : 'Select one option per poll and submit your vote securely.';
  }

  if (!polls.length) {
    host.innerHTML = `<div class="card"><h3>No polls available</h3><p class="section-subtitle">Ask an admin to create a poll and come back.</p></div>`;
    return;
  }

  if (isAdmin) {
    host.innerHTML = polls.map((poll) => buildAdminPollMarkup(poll)).join('');

    document.querySelectorAll('[data-view-results]').forEach((button) => {
      button.addEventListener('click', () => {
        const pollId = button.dataset.viewResults;
        const panel = document.getElementById(`admin-results-${pollId}`);
        if (!panel) return;

        const isOpen = panel.classList.toggle('open');
        panel.setAttribute('aria-hidden', String(!isOpen));
        button.textContent = isOpen ? 'Hide Results' : 'View Results';
      });
    });

    return;
  }

  host.innerHTML = polls
    .map((poll) => {
      const settings = normalizePollSettings(poll);
      const voteKey = getVoteKey(user.email, poll.id);
      const storedSelection = votes[voteKey];
      const selectedOptionIds = Array.isArray(storedSelection)
        ? storedSelection
        : storedSelection
          ? [storedSelection]
          : [];
      const voted = selectedOptionIds.length > 0;
      const inputType = settings.mode === 'multiple' ? 'checkbox' : 'radio';
      const voteHint =
        settings.mode === 'multiple'
          ? `Select up to ${settings.maxSelections} option${settings.maxSelections > 1 ? 's' : ''}.`
          : 'Select exactly one option.';

      return `
        <article class="card poll-card reveal">
          ${voted ? '<span class="status-pill voted">Already Voted</span>' : ''}
          <h3>${poll.title}</h3>
          <p>${poll.description}</p>
          <p class="section-subtitle">${voteHint}</p>
          <form class="vote-form" data-poll-id="${poll.id}">
            <div class="option-list">
              ${poll.options
                .map(
                  (option) => `
                    <label class="option-item">
                      <input type="${inputType}" name="poll-${poll.id}" value="${option.id}" ${voted ? 'disabled' : ''} ${
                    selectedOptionIds.includes(option.id) ? 'checked' : ''
                  }>
                      <span>${option.text}</span>
                    </label>
                  `
                )
                .join('')}
            </div>
            <button class="btn btn-primary" type="submit" ${voted ? 'disabled' : ''}>${voted ? 'Vote Submitted' : 'Vote Now'}</button>
            <p class="form-message" id="msg-${poll.id}"></p>
          </form>
          ${voted ? buildResultMarkup(poll) : ''}
        </article>
      `;
    })
    .join('');

  document.querySelectorAll('.vote-form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const pollId = form.dataset.pollId;
      const poll = getPolls().find((item) => item.id === pollId);
      if (!poll) return;

      const settings = normalizePollSettings(poll);
      const freshVotes = getVotes();
      const voteKey = getVoteKey(user.email, pollId);

      if (freshVotes[voteKey]) {
        setMessage(`msg-${pollId}`, 'You have already voted in this poll.', 'error');
        return;
      }

      const selectedInputs = [...form.querySelectorAll(`input[name="poll-${pollId}"]:checked`)];
      const selectedIds = selectedInputs.map((input) => input.value);

      if (!selectedIds.length) {
        setMessage(`msg-${pollId}`, 'Please select at least one option before voting.', 'error');
        return;
      }

      if (settings.mode === 'single' && selectedIds.length !== 1) {
        setMessage(`msg-${pollId}`, 'Please select exactly one option.', 'error');
        return;
      }

      if (settings.mode === 'multiple' && selectedIds.length > settings.maxSelections) {
        setMessage(
          `msg-${pollId}`,
          `You can select up to ${settings.maxSelections} option${settings.maxSelections > 1 ? 's' : ''}.`,
          'error'
        );
        return;
      }

      const polls = getPolls();
      const pollIndex = polls.findIndex((item) => item.id === pollId);
      if (pollIndex === -1) return;

      const selectedSet = new Set(selectedIds);
      const validSelection = polls[pollIndex].options.filter((item) => selectedSet.has(item.id));
      if (!validSelection.length) return;

      // Save one vote per user per poll.
      validSelection.forEach((option) => {
        option.votes += 1;
      });
      freshVotes[voteKey] = selectedIds;
      setPolls(polls);
      setVotes(freshVotes);

      setMessage(`msg-${pollId}`, 'Vote confirmed. Thanks for participating!', 'success');
      setTimeout(() => initPollsPage(user), 450);
    });
  });
}

function createOptionInput(index) {
  return `
    <div class="option-row">
      <input type="text" name="option" placeholder="Option ${index}" required>
    </div>
  `;
}

function renderAdminPollTable() {
  const host = document.getElementById('adminPollRows');
  if (!host) return;

  const polls = getPolls();
  if (!polls.length) {
    host.innerHTML = '<tr><td colspan="5">No polls created yet.</td></tr>';
    return;
  }

  host.innerHTML = polls
    .map((poll) => {
      const resultSummary = poll.options.map((option) => `${option.text}: ${option.votes}`).join(' | ');
      return `
        <tr>
          <td>${poll.title}</td>
          <td>${poll.description}</td>
          <td>${poll.options.length}</td>
          <td>${resultSummary}</td>
          <td><button class="btn btn-danger" data-delete-id="${poll.id}">Delete</button></td>
        </tr>
      `;
    })
    .join('');

  host.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.deleteId;
      const polls = getPolls().filter((poll) => poll.id !== id);

      // Remove all votes that belong to the deleted poll.
      const votes = getVotes();
      Object.keys(votes).forEach((key) => {
        if (key.endsWith(`__${id}`)) {
          delete votes[key];
        }
      });

      setPolls(polls);
      setVotes(votes);
      renderAdminPollTable();
    });
  });
}

function initAdminPage(user) {
  if (!user || user.role !== 'admin') return;

  const form = document.getElementById('pollForm');
  const addOptionBtn = document.getElementById('addOptionBtn');
  const optionWrap = document.getElementById('optionsWrap');
  const voteTypeInput = document.getElementById('voteType');
  const maxSelectionsInput = document.getElementById('maxSelections');
  let optionCount = 2;

  const syncVoteTypeHint = () => {
    const isMultiple = voteTypeInput?.value === 'multiple';
    if (!maxSelectionsInput) return;

    maxSelectionsInput.disabled = !isMultiple;
    if (!isMultiple) {
      maxSelectionsInput.value = '1';
    } else if (Number(maxSelectionsInput.value) < 2) {
      maxSelectionsInput.value = '2';
    }
  };

  voteTypeInput?.addEventListener('change', syncVoteTypeHint);
  syncVoteTypeHint();

  if (optionWrap && optionWrap.children.length === 0) {
    optionWrap.insertAdjacentHTML('beforeend', createOptionInput(1));
    optionWrap.insertAdjacentHTML('beforeend', createOptionInput(2));
  }

  addOptionBtn?.addEventListener('click', () => {
    optionCount += 1;
    optionWrap.insertAdjacentHTML('beforeend', createOptionInput(optionCount));
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();

    const title = document.getElementById('pollTitle').value.trim();
    const description = document.getElementById('pollDescription').value.trim();
    const voteType = voteTypeInput?.value === 'multiple' ? 'multiple' : 'single';
    const requestedMaxSelections = Number(maxSelectionsInput?.value || 1);
    const options = [...document.querySelectorAll('input[name="option"]')]
      .map((input) => input.value.trim())
      .filter(Boolean);

    if (title.length < 4) {
      setMessage('pollMessage', 'Title must be at least 4 characters.', 'error');
      return;
    }

    if (description.length < 8) {
      setMessage('pollMessage', 'Description must be at least 8 characters.', 'error');
      return;
    }

    if (options.length < 2) {
      setMessage('pollMessage', 'Please add at least 2 options.', 'error');
      return;
    }

    if (voteType === 'multiple' && (!Number.isInteger(requestedMaxSelections) || requestedMaxSelections < 2)) {
      setMessage('pollMessage', 'For multiple choice, max selections must be at least 2.', 'error');
      return;
    }

    const maxSelections =
      voteType === 'multiple' ? Math.min(requestedMaxSelections, options.length) : 1;

    const polls = getPolls();
    polls.unshift({
      id: crypto.randomUUID(),
      title,
      description,
      createdBy: user.email,
      createdAt: Date.now(),
      settings: {
        mode: voteType,
        maxSelections
      },
      options: options.map((optionText) => ({
        id: crypto.randomUUID(),
        text: optionText,
        votes: 0
      }))
    });

    setPolls(polls);
    form.reset();
    optionWrap.innerHTML = '';
    optionCount = 2;
    optionWrap.insertAdjacentHTML('beforeend', createOptionInput(1));
    optionWrap.insertAdjacentHTML('beforeend', createOptionInput(2));
    if (voteTypeInput) {
      voteTypeInput.value = 'single';
    }
    if (maxSelectionsInput) {
      maxSelectionsInput.value = '2';
    }
    syncVoteTypeHint();

    setMessage('pollMessage', 'Poll created successfully.', 'success');
    renderAdminPollTable();
  });

  renderAdminPollTable();
}

function initLandingPage() {
  const voteNowBtn = document.getElementById('heroGetStarted');
  voteNowBtn?.addEventListener('click', () => {
    const user = getSession();
    window.location.href = user ? 'dashboard.html' : 'signup.html';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  ensureSeedData();

  const page = document.body.dataset.page || 'index';
  const user = ensureAuthRedirect(page);

  renderNavbar(page, user);
  renderFooter();

  if (page === 'signup') initSignupPage();
  if (page === 'login') initLoginPage();
  if (page === 'dashboard') initDashboardPage(user);
  if (page === 'polls') initPollsPage(user);
  if (page === 'admin') initAdminPage(user);
  if (page === 'index') initLandingPage();
});
