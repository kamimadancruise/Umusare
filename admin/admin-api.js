(function () {
  const viteEnv = import.meta && import.meta.env ? import.meta.env : {};
  const isLocalHost = ["", "localhost", "127.0.0.1"].includes(window.location.hostname)
    || window.location.protocol === "file:";
  const isStagingHost = /admin-staging\.umusare\.com$/i.test(window.location.hostname);
  const defaultApiBaseUrl = isLocalHost
    ? "http://localhost:5000/api"
    : isStagingHost
      ? "https://api-staging.umusare.com/api"
      : "https://api.umusare.com/api";
  const explicitApiBaseUrl = window.VITE_API_BASE_URL || window.UMUSARE_API_BASE_URL || viteEnv.VITE_API_BASE_URL;
  const storedApiBaseUrl = window.localStorage.getItem("VITE_API_BASE_URL")
    || window.localStorage.getItem("UMUSARE_API_BASE_URL");
  const APP_ENV = window.VITE_APP_ENV
    || window.UMUSARE_APP_ENV
    || viteEnv.VITE_APP_ENV
    || window.localStorage.getItem("VITE_APP_ENV")
    || window.localStorage.getItem("UMUSARE_APP_ENV")
    || (isLocalHost ? "development" : isStagingHost ? "staging" : "production");
  const isProduction = APP_ENV === "production";
  const TEST_MODE_ENABLED = !isProduction && String(
    window.VITE_ENABLE_TEST_MODE
    || window.UMUSARE_ENABLE_TEST_MODE
    || viteEnv.VITE_ENABLE_TEST_MODE
    || window.localStorage.getItem("VITE_ENABLE_TEST_MODE")
    || window.localStorage.getItem("UMUSARE_ENABLE_TEST_MODE")
    || (isLocalHost || isStagingHost ? "true" : "false")
  ) === "true";
  const DEMO_DATA_ENABLED = !isProduction && String(
    window.VITE_ENABLE_DEMO_DATA
    || window.UMUSARE_ENABLE_DEMO_DATA
    || viteEnv.VITE_ENABLE_DEMO_DATA
    || window.localStorage.getItem("VITE_ENABLE_DEMO_DATA")
    || window.localStorage.getItem("UMUSARE_ENABLE_DEMO_DATA")
    || (isStagingHost ? "true" : "false")
  ) === "true";
  const DUMMY_PAYMENTS_ENABLED = !isProduction && String(
    window.VITE_ENABLE_DUMMY_PAYMENTS
    || window.UMUSARE_ENABLE_DUMMY_PAYMENTS
    || viteEnv.VITE_ENABLE_DUMMY_PAYMENTS
    || window.localStorage.getItem("VITE_ENABLE_DUMMY_PAYMENTS")
    || window.localStorage.getItem("UMUSARE_ENABLE_DUMMY_PAYMENTS")
    || (TEST_MODE_ENABLED ? "true" : "false")
  ) === "true";
  const REAL_PAYMENTS_ENABLED = String(
    window.VITE_ENABLE_REAL_PAYMENTS
    || window.UMUSARE_ENABLE_REAL_PAYMENTS
    || viteEnv.VITE_ENABLE_REAL_PAYMENTS
    || window.localStorage.getItem("VITE_ENABLE_REAL_PAYMENTS")
    || window.localStorage.getItem("UMUSARE_ENABLE_REAL_PAYMENTS")
    || "false"
  ) === "true";
  const API_BASE_URL = explicitApiBaseUrl
    || (isLocalHost ? defaultApiBaseUrl : storedApiBaseUrl)
    || defaultApiBaseUrl;
  const TOKEN_KEY = "umusareAdminToken";
  const USER_KEY = "umusareAdminUser";

  function getToken() {
    return window.localStorage.getItem(TOKEN_KEY);
  }

  function setSession(token, user) {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  }

  function loginPath() {
    return "index.html";
  }

  function publicSitePath() {
    if (isLocalHost || window.location.protocol === "file:") {
      return "../frontend/index.html";
    }
    return "https://umusare.com/";
  }

  async function request(path, options) {
    const requestOptions = options || {};
    const token = getToken();
    const headers = Object.assign(
      { "Content-Type": "application/json" },
      requestOptions.headers ? requestOptions.headers : {}
    );

    if (token) {
      headers.Authorization = "Bearer " + token;
    }

    let response;
    try {
      response = await fetch(API_BASE_URL + path, Object.assign({}, requestOptions, { headers }));
    } catch (error) {
      throw new Error("Unable to reach the Umusare backend. Check the admin API base URL and try again.");
    }
    const payload = await response.json().catch(function () {
      return { success: false, message: "Invalid API response" };
    });

    if (response.status === 401 && !requestOptions.skipAuthRedirect) {
      clearSession();
      window.location.href = loginPath();
      throw new Error(payload.message || "Not authorized");
    }

    if (response.status === 403) {
      clearSession();
      throw new Error(payload.message || "This account is not authorized to access the admin portal.");
    }

    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || "Request failed");
    }

    return payload;
  }

  async function loginAdmin(credentials) {
    const payload = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
      skipAuthRedirect: true
    });
    const data = payload.data || {};
    const user = data.user;
    const token = data.token;

    if (!user || user.role !== "admin") {
      clearSession();
      throw new Error("This account is not authorized to access the admin portal.");
    }

    setSession(token, user);
    return user;
  }

  async function requireAdmin() {
    const token = getToken();
    if (!token) {
      window.location.href = loginPath();
      return null;
    }

    try {
      const payload = await request("/auth/me", { method: "GET" });
      const user = payload.data && payload.data.user;
      if (!user || user.role !== "admin") {
        clearSession();
        showUnauthorized("This account is not authorized to access the admin portal.");
        return null;
      }
      setSession(token, user);
      document.documentElement.classList.add("admin-authenticated");
      return user;
    } catch (error) {
      showUnauthorized(error.message || "Admin session could not be verified.");
      return null;
    }
  }

  async function logout() {
    try {
      await request("/auth/logout", { method: "POST" });
    } catch (error) {
      // JWT logout is front-end driven; clearing local token is the important action.
    }
    clearSession();
    window.location.href = loginPath();
  }

  function showUnauthorized(message) {
    document.documentElement.classList.add("admin-authenticated");
    const existing = document.getElementById("adminAuthStatus");
    if (existing) {
      existing.textContent = message;
      existing.hidden = false;
    } else {
      const panel = document.createElement("div");
      panel.id = "adminAuthStatus";
      panel.className = "admin-auth-status";
      panel.setAttribute("role", "alert");
      panel.innerHTML = '<strong>Unauthorized</strong><p>' + message + '</p><a class="btn btn-primary" href="' + loginPath() + '">Return to admin login</a><a class="btn btn-secondary" href="' + publicSitePath() + '">Go to public website</a>';
      document.body.prepend(panel);
    }
    window.setTimeout(function () {
      window.location.href = loginPath();
    }, 2200);
  }

  window.UmusareAdminAuth = {
    API_BASE_URL,
    APP_ENV,
    TEST_MODE_ENABLED,
    DEMO_DATA_ENABLED,
    DUMMY_PAYMENTS_ENABLED,
    REAL_PAYMENTS_ENABLED,
    getToken,
    request,
    loginAdmin,
    requireAdmin,
    logout,
    clearSession
  };

  if (typeof window.UmusareAddTestModeBanner === "function") {
    window.UmusareAddTestModeBanner();
  }
  if (typeof window.UmusareUpdateDemoAccessVisibility === "function") {
    window.UmusareUpdateDemoAccessVisibility();
  }
})();
