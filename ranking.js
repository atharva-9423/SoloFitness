
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  const userData = JSON.parse(localStorage.getItem('soloFitnessUser'));
  if (!userData || !userData.isLoggedIn) {
    window.location.href = 'login.html';
    return;
  }
  
  // Load user game data
  const userGameData = JSON.parse(localStorage.getItem('soloFitnessData')) || {};
  
  // Initialize friends list
  const friends = loadFriends();
  updateFriendsRankingList();
  
  // Add friend button handler
  const addFriendBtn = document.getElementById('addFriendBtn');
  const friendEmailInput = document.getElementById('friendEmail');
  
  if (addFriendBtn && friendEmailInput) {
    addFriendBtn.addEventListener('click', () => {
      const email = friendEmailInput.value.trim();
      if (email) {
        if (addFriend(email)) {
          // Success - clear input field and update list
          friendEmailInput.value = '';
          updateFriendsRankingList();
        }
      } else {
        showFriendNotification("Please enter an email address", "error");
      }
    });
    
    // Also allow pressing Enter to add friend
    friendEmailInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addFriendBtn.click();
      }
    });
  }
  
  // Simulate some global ranking (for now)
  document.getElementById('globalRankNumber').textContent = userGameData.global || Math.floor(Math.random() * 10000) + 1;
  
  // Function to update the friends ranking list display
  function updateFriendsRankingList() {
    const friendsList = document.getElementById('friendsRankingList');
    if (!friendsList) return;
    
    // Clear existing list
    friendsList.innerHTML = '';
    
    // Get current user data to add to list
    const currentUser = {
      id: 'current-user',
      name: userData.name ? userData.name.split(' ')[0] : 'You',
      email: userData.email || '',
      rank: userGameData.rank || 'E',
      streak: userGameData.streak || 0,
      score: calculateUserScore(userGameData),
      isCurrentUser: true
    };
    
    // Combine user and friends for ranking
    const allUsers = [currentUser, ...getFriendRankings()];
    
    // Sort by score
    allUsers.sort((a, b) => b.score - a.score);
    
    // Generate list items
    if (allUsers.length > 0) {
      allUsers.forEach((user, index) => {
        const listItem = document.createElement('div');
        listItem.className = `friend-item ${user.isCurrentUser ? 'current-user' : ''}`;
        
        listItem.innerHTML = `
          <div class="rank-col">#${index + 1}</div>
          <div class="name-col">
            ${user.name} ${user.isCurrentUser ? '(YOU)' : ''}
            <span class="friend-email">${user.email}</span>
          </div>
          <div class="stats-col">
            <span class="friend-rank">RANK: ${user.rank}</span>
            <span class="friend-streak">STREAK: ${user.streak}</span>
          </div>
          <div class="action-col">
            ${user.isCurrentUser ? '' : `<button class="remove-friend-btn" data-id="${user.id}">REMOVE</button>`}
          </div>
        `;
        
        friendsList.appendChild(listItem);
      });
      
      // Add event listeners to remove buttons
      document.querySelectorAll('.remove-friend-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const friendId = parseInt(e.target.dataset.id);
          if (removeFriend(friendId)) {
            // Refresh the list
            updateFriendsRankingList();
          }
        });
      });
    } else {
      // Show message if no friends
      friendsList.innerHTML = '<div class="no-friends">Add friends to see how you rank against them!</div>';
    }
  }
  
  // Calculate a score for ranking based on user data
  function calculateUserScore(userData) {
    // This is a simple scoring formula you can adjust
    const rankValue = {
      'F': 0,
      'E': 100,
      'D': 200,
      'C': 400,
      'B': 800,
      'A': 1600,
      'S': 3200
    };
    
    const rankScore = rankValue[userData.rank || 'E'];
    const streakScore = (userData.streak || 0) * 50;
    const goldScore = (userData.gold || 0) * 0.5;
    
    return rankScore + streakScore + goldScore;
  }
});
