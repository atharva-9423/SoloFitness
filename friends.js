
// Friends management functionality
let userFriends = [];

// Load friends from localStorage or initialize empty array
function loadFriends() {
  const storedFriends = localStorage.getItem('soloFitnessFriends');
  userFriends = storedFriends ? JSON.parse(storedFriends) : [];
  return userFriends;
}

// Save friends to localStorage
function saveFriends() {
  localStorage.setItem('soloFitnessFriends', JSON.stringify(userFriends));
}

// Add a friend by email
function addFriend(email, name = null) {
  // Validate email format
  if (!validateEmail(email)) {
    showFriendNotification("Please enter a valid email address", "error");
    return false;
  }
  
  // Check if already in friends list
  if (userFriends.some(friend => friend.email.toLowerCase() === email.toLowerCase())) {
    showFriendNotification("This friend is already in your list", "error");
    return false;
  }
  
  // Add new friend
  const newFriend = {
    id: Date.now(), // Generate unique ID
    email: email,
    name: name || email.split('@')[0], // Use part before @ as name if not provided
    dateAdded: new Date().toISOString(),
    // Random example stats for demo
    rank: getRankForFriend(),
    streak: Math.floor(Math.random() * 14),
    score: Math.floor(Math.random() * 1000)
  };
  
  userFriends.push(newFriend);
  saveFriends();
  showFriendNotification(`Friend ${newFriend.name} added successfully!`, "success");
  return true;
}

// Remove a friend
function removeFriend(friendId) {
  const friendIndex = userFriends.findIndex(friend => friend.id === friendId);
  if (friendIndex !== -1) {
    const friendName = userFriends[friendIndex].name;
    userFriends.splice(friendIndex, 1);
    saveFriends();
    showFriendNotification(`Friend ${friendName} removed`, "success");
    return true;
  }
  return false;
}

// Get a random rank for demo purposes
function getRankForFriend() {
  const ranks = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
  return ranks[Math.floor(Math.random() * ranks.length)];
}

// Email validation
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Show friend-related notifications
function showFriendNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `rank-notification ${type}`;
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

// Get a sorted list of friends by score
function getFriendRankings() {
  return [...userFriends].sort((a, b) => b.score - a.score);
}
