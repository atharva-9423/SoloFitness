
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  const userData = JSON.parse(localStorage.getItem('soloFitnessUser'));
  if (!userData || !userData.isLoggedIn) {
    window.location.href = 'login.html';
    return;
  }
  
  // Initialize default user data
  const defaultUserData = {
    name: userData.name ? userData.name.toUpperCase().split(' ')[0] : 'HUNTER',
    tag: '@' + (userData.name ? userData.name.toUpperCase().replace(/\s+/g, '_') : 'HUNTER_488'),
    hp: 3,
    maxHp: 3,
    exp: 0.5,
    maxExp: 1,
    rank: 'E',
    streak: 0, // Current streak count
    streakDate: new Date().toDateString(), // Last date streak was updated
    global: 0,
    gold: 0,
    lastReset: new Date().toDateString(), // Track the last reset date
    tasks: {
      pushups: { target: 10, completed: 0 },
      situps: { target: 10, completed: 0 },
      squats: { target: 10, completed: 0 },
      run: { target: 1.0, completed: 0 }
    },
    history: [] // Store workout history by date
  };
  
  // Load saved data from localStorage or use defaults
  let userGameData = JSON.parse(localStorage.getItem('soloFitnessData')) || defaultUserData;

  // Update task progress when clicked
  document.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('click', () => {
      const exercise = card.querySelector('.exercise').textContent.toLowerCase();
      // Fix the mapping to match task names in userGameData
      let taskName;
      if (exercise.includes('pushup')) taskName = 'pushups';
      else if (exercise.includes('situp')) taskName = 'situps';
      else if (exercise.includes('squat')) taskName = 'squats';
      else if (exercise.includes('run')) taskName = 'run';
      
      // Check if taskName is valid before proceeding
      if (taskName && userGameData.tasks[taskName]) {
        const task = userGameData.tasks[taskName];
        
        if (task.completed < task.target) {
          // Complete the task in one click
          task.completed = task.target;
          updateTaskUI(card, task);
          checkDailyProgress();
          updateHistoryUI(); // Update history after task completion
        }
      } else {
        console.error("Task not found:", exercise, taskName);
      }
    });
  });

  function updateTaskUI(card, task) {
    if (!task) return; // Guard against undefined tasks
    
    const progress = (task.completed / task.target) * 100;
    card.querySelector('.progress-indicator').style.width = `${progress}%`;
    
    if (progress === 100) {
      card.style.opacity = '0.8';
      card.style.boxShadow = '0 0 15px var(--success-color), 0 0 25px rgba(0, 209, 102, 0.4)';
      card.style.borderColor = 'var(--success-color)';
      card.style.animation = 'none'; // Stop the red pulse animation
      
      // Add completion animation only if this is a new completion (not on page load)
      if (!card.classList.contains('completed-task')) {
        card.classList.add('task-completed');
        setTimeout(() => {
          card.classList.remove('task-completed');
        }, 1000);
      }
      
      // Mark as completed for future reference
      card.classList.add('completed-task');
    } else {
      card.style.opacity = '1';
      card.style.boxShadow = '0 0 15px var(--accent-glow), 0 0 25px rgba(255, 56, 56, 0.2)';
      card.style.borderColor = 'var(--accent-color)';
      card.style.animation = 'cardPulse 2s infinite alternate'; // Restore red pulse animation
      card.classList.remove('completed-task');
    }
  }

  function checkDailyProgress() {
    let completed = 0;
    let total = Object.keys(userGameData.tasks).length;
    
    for (let task in userGameData.tasks) {
      if (userGameData.tasks[task].completed >= userGameData.tasks[task].target) {
        completed++;
      }
    }

    if (completed === total) {
      // Increment streak for same-day completion
      const today = new Date().toDateString();
      if (userGameData.streakDate !== today) {
        // Only increment if not already incremented today
        userGameData.streak++;
        userGameData.streakDate = today;
        showNotification(`Streak: ${userGameData.streak} day${userGameData.streak > 1 ? 's' : ''}! Keep going!`);
        
        // Record the completed workout in history
        const today = new Date().toDateString();
        const workoutRecord = {
          date: today,
          completed: true,
          tasks: JSON.parse(JSON.stringify(userGameData.tasks)) // Deep copy tasks
        };
        
        // Add to history if not already recorded today
        if (!userGameData.history.some(record => record.date === today)) {
          userGameData.history.push(workoutRecord);
          // Keep only last 30 days of history
          if (userGameData.history.length > 30) {
            userGameData.history.shift(); // Remove oldest record
          }
        }
      }
      
      // Restore 1 HP if HP is below maximum and all tasks are completed
      if (userGameData.hp < userGameData.maxHp) {
        userGameData.hp++;
        
        // Animate HP bar when HP increases
        const hpBar = document.querySelector('.hp-bar');
        hpBar.classList.add('pulse-hp-animation');
        setTimeout(() => {
          hpBar.classList.remove('pulse-hp-animation');
        }, 1000);
        
        showNotification("Great job! Recovered 1 HP!");
      }
      
      // Update UI to reflect changes
      updateStats();
      
      // Check if streak reached 7 days for rank up
      if (userGameData.streak >= 7) {
        userGameData.exp = userGameData.maxExp; // Fill exp bar for rank up
        const oldRank = userGameData.rank;
        levelUp();
        userGameData.streak = 0; // Reset streak after rank up
        
        // Show special message based on new rank
        const newRank = userGameData.rank;
        const rankMessages = {
          'D': "AMAZING! You've graduated to D rank! Keep going!",
          'C': "INCREDIBLE! You've reached C rank! Your perseverance is paying off!",
          'B': "OUTSTANDING! B rank achieved! You're becoming stronger!",
          'A': "PHENOMENAL! A rank unlocked! True strength is within your grasp!",
          'S': "LEGENDARY! You've reached S rank! You are among the elite!"
        };
        
        showNotification(rankMessages[newRank] || "AMAZING! You've completed 7 days in a row! RANK UP!");
      }
      
      // Save data
      saveUserData();
    }
  }

  function levelUp() {
    userGameData.exp += 0.25;
    
    // Add pulse animation to exp bar
    const expBar = document.querySelector('.exp-bar');
    expBar.classList.add('pulse-exp-animation');
    setTimeout(() => {
      expBar.classList.remove('pulse-exp-animation');
    }, 1000);
    
    if (userGameData.exp >= userGameData.maxExp) {
      // Progress through rank system: E to D to C to B to A to S
      userGameData.rank = getRankUp(userGameData.rank);
      userGameData.exp = 0;
      userGameData.gold += 100;
      
      // Show rank up notification with special animation for higher ranks
      const rankUpMessage = `RANK UP! You are now ${userGameData.rank} rank!`;
      showNotification(rankUpMessage);
      
      // Add special effects for higher ranks
      if (['A', 'S'].includes(userGameData.rank)) {
        // Create a special background flash effect for top ranks
        const flashEffect = document.createElement('div');
        flashEffect.className = 'rank-up-flash';
        document.body.appendChild(flashEffect);
        
        setTimeout(() => {
          flashEffect.remove();
        }, 1500);
      }
    }
    updateStats();
    
    // Save changes to localStorage
    saveUserData();
  }
  
  function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'rank-notification';
    notification.textContent = message;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    // Remove after animation
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  }

  function getRankUp(currentRank) {
    const ranks = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
    const currentIndex = ranks.indexOf(currentRank);
    return currentIndex < ranks.length - 1 ? ranks[currentIndex + 1] : ranks[currentIndex];
  }

  // Function to save data to localStorage
  function saveUserData() {
    localStorage.setItem('soloFitnessData', JSON.stringify(userGameData));
  }
  
  function updateStats() {
    // Update progress bars
    document.querySelector('.hp-bar .progress').style.width = 
      `${(userGameData.hp / userGameData.maxHp) * 100}%`;
    document.querySelector('.hp-bar span').textContent = `HP ${userGameData.hp}/${userGameData.maxHp}`;
    document.querySelector('.exp-bar .progress').style.width = 
      `${(userGameData.exp / userGameData.maxExp) * 100}%`;
    // Update the exp bar to show progress (1/7, 2/7, etc.)
    const daysLeft = 7 - userGameData.streak;
    const progressText = userGameData.streak >= 7 
      ? `RANK UP!` 
      : userGameData.streak === 0 
        ? `0/7 DAYS TO RANK UP` 
        : `${userGameData.streak}/7 DAYS TO RANK UP`;
    
    document.querySelector('.exp-bar span').textContent = progressText;
    
    // Set the EXP bar width based on streak progress (0% to 100%)
    document.querySelector('.exp-bar .progress').style.width = 
      `${(userGameData.streak / 7) * 100}%`;
    
    // Update stats
    document.querySelector('.stats-box').innerHTML = `
      <div class="stat">
        <span class="label">RANK</span>
        <span class="value">${userGameData.rank}</span>
      </div>
      <div class="stat">
        <span class="label">STREAK</span>
        <span class="value">${userGameData.streak}</span>
      </div>
      <div class="stat">
        <span class="label">GLOBAL #</span>
        <span class="value">${userGameData.global}</span>
      </div>
      <div class="stat">
        <span class="label">GOLD</span>
        <span class="value">${userGameData.gold}</span>
      </div>
    `;
    
    // Save changes to localStorage
    saveUserData();
  }

  // Function to update workout history display
  function updateHistoryUI() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return; // Skip if the element doesn't exist
    
    historyList.innerHTML = ''; // Clear existing history
    
    if (userGameData.history && userGameData.history.length > 0) {
      // Sort history by date, most recent first
      const sortedHistory = [...userGameData.history].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
      
      sortedHistory.forEach(record => {
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${record.completed ? 'completed' : 'missed'}`;
        
        const dateObj = new Date(record.date);
        const formattedDate = `${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        
        historyItem.innerHTML = `
          <span class="history-date">${formattedDate}</span>
          <span class="history-status ${record.completed ? 'completed' : 'missed'}">
            ${record.completed ? 'COMPLETED' : 'MISSED'}
          </span>
        `;
        
        historyList.appendChild(historyItem);
      });
    } else {
      // Show message if no history
      historyList.innerHTML = '<div class="no-history">No workout history yet. Complete your first workout!</div>';
    }
  }
  
  // Initialize UI
  updateStats();
  updateHistoryUI();
  
  // Set initial EXP bar to match streak progress
  document.querySelector('.exp-bar .progress').style.width = 
    `${(userGameData.streak / 7) * 100}%`;
  
  // Update initial exp bar text
  const initialProgressText = userGameData.streak >= 7 
    ? `RANK UP!` 
    : userGameData.streak === 0 
      ? `0/7 DAYS TO RANK UP` 
      : `${userGameData.streak}/7 DAYS TO RANK UP`;
  document.querySelector('.exp-bar span').textContent = initialProgressText;
  
  // Settings functionality
  // Default settings
  const defaultSettings = {
    darkMode: true,
    notifications: true,
    syncProgress: false
  };
  
  // Function to save settings to localStorage
  function saveSettings() {
    const settings = {
      darkMode: document.getElementById('darkModeToggle').checked,
      notifications: document.getElementById('notificationsToggle').checked,
      syncProgress: document.getElementById('syncToggle').checked
    };
    localStorage.setItem('soloFitnessSettings', JSON.stringify(settings));
    
    // Apply dark mode setting
    document.body.classList.toggle('light-mode', !settings.darkMode);
  }
  
  // Function to load settings from localStorage
  function loadSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('soloFitnessSettings')) || defaultSettings;
    
    document.getElementById('darkModeToggle').checked = savedSettings.darkMode;
    document.getElementById('notificationsToggle').checked = savedSettings.notifications;
    document.getElementById('syncToggle').checked = savedSettings.syncProgress;
    
    // Apply dark mode setting
    document.body.classList.toggle('light-mode', !savedSettings.darkMode);
  }
  
  // Setup settings panel
  const settingsBtn = document.querySelector('.nav-btn[data-page="settings"]');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      // Create settings panel if it doesn't exist
      if (!document.getElementById('settingsPanel')) {
        const settingsPanel = document.createElement('div');
        settingsPanel.id = 'settingsPanel';
        settingsPanel.className = 'settings-panel';
        settingsPanel.innerHTML = `
          <div class="settings-header">
            <h2>SETTINGS</h2>
            <button id="closeSettings">×</button>
          </div>
          
          <div class="setting-item">
            <div>
              <div class="setting-label">DARK MODE</div>
              <div class="setting-info">Toggle dark/light theme</div>
            </div>
            <div class="toggle-switch">
              <input type="checkbox" id="darkModeToggle" checked>
              <label for="darkModeToggle"></label>
            </div>
          </div>
          
          <div class="setting-item">
            <div>
              <div class="setting-label">NOTIFICATIONS</div>
              <div class="setting-info">Enable notifications</div>
            </div>
            <div class="toggle-switch">
              <input type="checkbox" id="notificationsToggle" checked>
              <label for="notificationsToggle"></label>
            </div>
          </div>
          
          <div class="setting-item">
            <div>
              <div class="setting-label">SYNC PROGRESS</div>
              <div class="setting-info">Sync progress across devices</div>
            </div>
            <div class="toggle-switch">
              <input type="checkbox" id="syncToggle">
              <label for="syncToggle"></label>
            </div>
          </div>
          
          <div class="setting-item">
            <div>
              <div class="setting-label">USERNAME</div>
              <div class="setting-info">Change your display name</div>
            </div>
            <div>
              <input type="text" id="usernameInput" class="setting-input" placeholder="Enter username">
              <button id="saveUsernameBtn" class="save-btn">SAVE</button>
            </div>
          </div>
          
          <div class="setting-item danger-zone">
            <div>
              <div class="setting-label">RESET PROGRESS</div>
              <div class="setting-info">This action cannot be undone</div>
            </div>
            <button id="resetProgressBtn" class="danger-btn">RESET</button>
          </div>
        `;
        
        document.body.appendChild(settingsPanel);
        
        // Close settings panel
        document.getElementById('closeSettings').addEventListener('click', () => {
          settingsPanel.classList.remove('show');
          setTimeout(() => {
            document.body.removeChild(settingsPanel);
          }, 300);
        });
        
        // Load settings from localStorage
        loadSettings();
        
        // Settings change handlers
        document.getElementById('darkModeToggle').addEventListener('change', (e) => {
          saveSettings();
        });
        
        document.getElementById('notificationsToggle').addEventListener('change', (e) => {
          saveSettings();
        });
        
        document.getElementById('syncToggle').addEventListener('change', (e) => {
          saveSettings();
        });
        
        // Username change functionality
        document.getElementById('saveUsernameBtn').addEventListener('click', () => {
          const newUsername = document.getElementById('usernameInput').value.trim();
          if (newUsername.length > 0) {
            // Update username in userGameData
            userGameData.name = newUsername.toUpperCase();
            userGameData.tag = '@' + newUsername.toUpperCase().replace(/\s+/g, '_');
            
            // Update UI
            const userNameElement = document.getElementById('userName');
            const userTagElement = document.getElementById('userTag');
            
            if (userNameElement) {
              userNameElement.textContent = userGameData.name;
            }
            
            if (userTagElement) {
              userTagElement.textContent = userGameData.tag;
            }
            
            // Save changes
            saveUserData();
            showNotification("Username updated successfully!");
            
            // Clear input
            document.getElementById('usernameInput').value = '';
          } else {
            showNotification("Please enter a valid username");
          }
        });
        
        // Reset progress button
        document.getElementById('resetProgressBtn').addEventListener('click', () => {
          if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
            localStorage.removeItem('soloFitnessData');
            showNotification('Progress has been reset. Reloading...');
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }
        });
        
        // Show settings panel with animation
        setTimeout(() => {
          settingsPanel.classList.add('show');
        }, 10);
      } else {
        // If panel already exists, just show it
        document.getElementById('settingsPanel').classList.add('show');
      }
    });
  }
  
  // Setup logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      // Clear auth data
      localStorage.removeItem('soloFitnessUser');
      // Redirect to login page
      window.location.href = 'login.html';
    });
  }
  
  // Setup ranking button
  const rankingBtn = document.querySelector('.nav-btn[data-page="ranking"]');
  if (rankingBtn) {
    rankingBtn.addEventListener('click', () => {
      window.location.href = 'ranking.html';
    });
  }
  
  // Update user name and tag from Google login data
  if (userData && userData.name) {
    const userNameElement = document.getElementById('userName');
    const userTagElement = document.getElementById('userTag');
    
    if (userNameElement) {
      userNameElement.textContent = userData.name.toUpperCase().split(' ')[0];
    }
    
    if (userTagElement) {
      userTagElement.textContent = '@' + userData.name.toUpperCase().replace(/\s+/g, '_');
    }
  }
  
  // Update profile picture with Google profile image if available
  if (userData && userData.picture) {
    const profilePic = document.getElementById('profilePic');
    if (profilePic) {
      profilePic.src = userData.picture;
    }
  }
  
  // Initialize task UI to show current progress
  document.querySelectorAll('.task-card').forEach(card => {
    const exercise = card.querySelector('.exercise').textContent.toLowerCase();
    let taskName;
    if (exercise.includes('pushup')) taskName = 'pushups';
    else if (exercise.includes('situp')) taskName = 'situps';
    else if (exercise.includes('squat')) taskName = 'squats';
    else if (exercise.includes('run')) taskName = 'run';
    
    if (taskName && userGameData.tasks[taskName]) {
      updateTaskUI(card, userGameData.tasks[taskName]);
    }
  });
  
  // Check for task reset on load and set interval to check periodically
  checkForDailyReset();
  setInterval(checkForDailyReset, 60000); // Check every minute
  
  // Function to check if we need to reset tasks for a new day
  function checkForDailyReset() {
    const currentDate = new Date();
    const currentDateString = currentDate.toDateString();
    
    // If it's a new day, reset tasks and check streak
    if (userGameData.lastReset !== currentDateString) {
      // Check if all tasks were completed before the day changed
      let allTasksCompleted = true;
      for (let task in userGameData.tasks) {
        if (userGameData.tasks[task].completed < userGameData.tasks[task].target) {
          allTasksCompleted = false;
          break;
        }
      }
      
      // Record yesterday's workout status in history
      const yesterday = new Date(currentDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toDateString();
      
      // Only record if not already recorded
      if (!userGameData.history.some(record => record.date === yesterdayString)) {
        const workoutRecord = {
          date: yesterdayString,
          completed: allTasksCompleted,
          tasks: JSON.parse(JSON.stringify(userGameData.tasks)) // Deep copy tasks
        };
        
        userGameData.history.push(workoutRecord);
        // Keep only last 30 days of history
        if (userGameData.history.length > 30) {
          userGameData.history.shift(); // Remove oldest record
        }
      }
      
      // Handle streak and HP based on completion
      if (allTasksCompleted) {
        // Increment streak ONLY if all tasks were completed
        userGameData.streak++;
        userGameData.streakDate = currentDateString;
        
        // Check if streak reached 7 days for rank up
        if (userGameData.streak >= 7) {
          userGameData.exp = userGameData.maxExp; // Fill exp bar for rank up
          levelUp();
          userGameData.streak = 0; // Reset streak after rank up
          showNotification("AMAZING! You've completed 7 days in a row! RANK UP!");
        } else {
          showNotification(`Streak: ${userGameData.streak} day${userGameData.streak > 1 ? 's' : ''}! Keep going!`);
        }
      } else {
        // Deduct HP for missing a day's workout
        if (userGameData.hp > 0) {
          userGameData.hp--;
          showNotification("You missed yesterday's workout! Lost 1 HP.");
          
          // Animate HP bar when HP decreases
          const hpBar = document.querySelector('.hp-bar');
          hpBar.classList.add('pulse-hp-animation');
          setTimeout(() => {
            hpBar.classList.remove('pulse-hp-animation');
          }, 1000);
          
          // Check if HP reaches zero
          if (userGameData.hp === 0) {
            showNotification("WARNING: HP is zero! Complete today's workout to recover!");
          }
        }
        
        // Reset streak when goals not completed
        userGameData.streak = 0;
        // Reset rank progress as well
        userGameData.exp = 0;
        showNotification("Streak reset! Complete all tasks to maintain your streak.");
      }
      
      // Reset all task completions for the new day and increase targets
      for (let task in userGameData.tasks) {
        // Reset completion
        userGameData.tasks[task].completed = 0;
        
        // Increase target for the next day
        if (task === 'run') {
          // For running, increase by 0.2 km
          userGameData.tasks[task].target = Math.round((userGameData.tasks[task].target + 0.2) * 10) / 10;
        } else {
          // For other exercises, increase by 2
          userGameData.tasks[task].target += 2;
        }
      }
      
      // Update exercise number display in UI
      document.querySelectorAll('.task-card').forEach(card => {
        const exercise = card.querySelector('.exercise').textContent.toLowerCase();
        let taskName;
        if (exercise.includes('pushup')) taskName = 'pushups';
        else if (exercise.includes('situp')) taskName = 'situps';
        else if (exercise.includes('squat')) taskName = 'squats';
        else if (exercise.includes('run')) taskName = 'run';
        
        if (taskName && userGameData.tasks[taskName]) {
          // Update the number display in UI
          const numberEl = card.querySelector('.number');
          if (numberEl) {
            numberEl.textContent = taskName === 'run' ? 
              userGameData.tasks[taskName].target.toFixed(1) + 'km' : 
              userGameData.tasks[taskName].target;
          }
        }
      });
      
      // Update the last reset date
      userGameData.lastReset = currentDateString;
      
      // Update the UI to show reset tasks
      document.querySelectorAll('.task-card').forEach(card => {
        const exercise = card.querySelector('.exercise').textContent.toLowerCase();
        let taskName;
        if (exercise.includes('pushup')) taskName = 'pushups';
        else if (exercise.includes('situp')) taskName = 'situps';
        else if (exercise.includes('squat')) taskName = 'squats';
        else if (exercise.includes('run')) taskName = 'run';
        
        if (taskName && userGameData.tasks[taskName]) {
          updateTaskUI(card, userGameData.tasks[taskName]);
        }
      });
      
      // Update HP and streak display
      updateStats();
      
      // Save changes to localStorage
      saveUserData();
      
      // Update history display
      updateHistoryUI();
      
      // Show notification that tasks have been reset and increased
      showNotification("New day, new challenges! Today's tasks have been increased.");
    }
  }
});
