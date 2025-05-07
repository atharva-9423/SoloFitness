
// Google Sign-In handler
function handleCredentialResponse(response) {
  // Decode the JWT token to get user information
  const responsePayload = parseJwt(response.credential);
  
  // Save user information to local storage
  const userData = {
    id: responsePayload.sub,
    name: responsePayload.name,
    email: responsePayload.email,
    picture: responsePayload.picture,
    isLoggedIn: true,
    loginTime: new Date().toISOString()
  };
  
  localStorage.setItem('soloFitnessUser', JSON.stringify(userData));
  
  // Redirect to main application
  window.location.href = 'index.html';
}

// JWT token parser
function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
  // If we're already on the login page, no need to redirect
  if (window.location.pathname.includes('login.html')) {
    return;
  }
  
  const userData = JSON.parse(localStorage.getItem('soloFitnessUser'));
  
  // If no user data or not logged in, redirect to login page
  if (!userData || !userData.isLoggedIn) {
    window.location.href = 'login.html';
  }
});
