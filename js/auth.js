
const AUTH_URL = "https://cwlzsjbzxsbpkokgnlhr.supabase.co";
const AUTH_KEY = "sb_publishable_PEWlEp2pD8obpUe9S8NFpA_AhZU8qF7";

const authClient = window.supabase.createClient(
  AUTH_URL,
  AUTH_KEY
);

// Register new customer
async function registerUser(email, password) {
  const { data, error } = await authClient.auth.signUp({
    email: email,
    password: password
  });

  if (error) {
    alert(error.message);
    return false;
  }

  alert("Registration successful! Please check your email.");
  return true;
}

// Login customer
async function loginUser(email, password) {
  const { data, error } = await authClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    alert(error.message);
    return false;
  }

  window.location.href = "product.html";
  return true;
}

// Logout customer
async function logoutUser() {
  const { error } = await authClient.auth.signOut();

  if (error) {
    alert(error.message);
    return;
  }

  window.location.href = "login.html";
}

// Check current user
async function getCurrentUser() {
  const { data, error } = await authClient.auth.getUser();
  return error ? null : data.user;
}

// Update navigation
async function updateAuthNavigation() {
  const nav = document.querySelector(".main-nav");
  if (!nav) return;

  const user = await getCurrentUser();

  const oldControls = document.getElementById("auth-controls");
  if (oldControls) oldControls.remove();

  const controls = document.createElement("span");
  controls.id = "auth-controls";

  if (user) {
    const email = document.createElement("span");
    email.textContent = user.email + " ";

    const logout = document.createElement("button");
    logout.textContent = "Logout";
    logout.addEventListener("click", logoutUser);

    controls.append(email, logout);
  } else {
    const login = document.createElement("a");
    login.href = "login.html";
    login.textContent = "Login";

    const register = document.createElement("a");
    register.href = "register.html";
    register.textContent = " Register";

    controls.append(login, register);
  }

  nav.appendChild(controls);
}

document.addEventListener(
  "DOMContentLoaded",
  updateAuthNavigation
);
