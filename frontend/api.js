(function () {
  const isLocalHost = ["", "localhost", "127.0.0.1"].includes(window.location.hostname)
    || window.location.protocol === "file:";
  const isStagingHost = /staging\.umusare\.com$/i.test(window.location.hostname);
  const defaultApiBaseUrl = isLocalHost
    ? "http://localhost:5000/api"
    : isStagingHost
      ? "https://api-staging.umusare.com/api"
      : "https://api.umusare.com/api";
  const APP_ENV = window.VITE_APP_ENV
    || window.UMUSARE_APP_ENV
    || window.localStorage.getItem("VITE_APP_ENV")
    || window.localStorage.getItem("UMUSARE_APP_ENV")
    || (isLocalHost ? "development" : isStagingHost ? "staging" : "production");
  const isProduction = APP_ENV === "production";
  const TEST_MODE_ENABLED = !isProduction && String(
    window.VITE_ENABLE_TEST_MODE
    || window.UMUSARE_ENABLE_TEST_MODE
    || window.localStorage.getItem("VITE_ENABLE_TEST_MODE")
    || window.localStorage.getItem("UMUSARE_ENABLE_TEST_MODE")
    || (isLocalHost || isStagingHost ? "true" : "false")
  ) === "true";
  const DEMO_DATA_ENABLED = !isProduction && String(
    window.VITE_ENABLE_DEMO_DATA
    || window.UMUSARE_ENABLE_DEMO_DATA
    || window.localStorage.getItem("VITE_ENABLE_DEMO_DATA")
    || window.localStorage.getItem("UMUSARE_ENABLE_DEMO_DATA")
    || (isStagingHost ? "true" : "false")
  ) === "true";
  const DUMMY_PAYMENTS_ENABLED = !isProduction && String(
    window.VITE_ENABLE_DUMMY_PAYMENTS
    || window.UMUSARE_ENABLE_DUMMY_PAYMENTS
    || window.localStorage.getItem("VITE_ENABLE_DUMMY_PAYMENTS")
    || window.localStorage.getItem("UMUSARE_ENABLE_DUMMY_PAYMENTS")
    || (TEST_MODE_ENABLED ? "true" : "false")
  ) === "true";
  const REAL_PAYMENTS_ENABLED = String(
    window.VITE_ENABLE_REAL_PAYMENTS
    || window.UMUSARE_ENABLE_REAL_PAYMENTS
    || window.localStorage.getItem("VITE_ENABLE_REAL_PAYMENTS")
    || window.localStorage.getItem("UMUSARE_ENABLE_REAL_PAYMENTS")
    || "false"
  ) === "true";
  const API_BASE_URL = window.VITE_API_BASE_URL
    || window.UMUSARE_API_BASE_URL
    || window.localStorage.getItem("VITE_API_BASE_URL")
    || window.localStorage.getItem("UMUSARE_API_BASE_URL")
    || defaultApiBaseUrl;
  const TOKEN_KEYS = ["umusareUserToken", "umusareDriverToken", "umusareAdminToken"];

  function getToken() {
    for (let index = 0; index < TOKEN_KEYS.length; index += 1) {
      const token = window.localStorage.getItem(TOKEN_KEYS[index]);
      if (token) return token;
    }
    return "";
  }

  async function request(path, options) {
    const requestOptions = options || {};
    const isFormData = requestOptions.body && typeof FormData !== "undefined" && requestOptions.body instanceof FormData;
    const headers = Object.assign(
      isFormData ? {} : { "Content-Type": "application/json" },
      requestOptions.headers ? requestOptions.headers : {}
    );
    const token = getToken();
    if (token) {
      headers.Authorization = "Bearer " + token;
    }

    let response;
    try {
      response = await fetch(API_BASE_URL + path, Object.assign({}, requestOptions, { headers }));
    } catch (error) {
      throw new Error("Unable to reach the Umusare backend. Please try again.");
    }
    const payload = await response.json().catch(function () {
      return { success: false, message: "Invalid API response" };
    });

    if (!response.ok || payload.success === false) {
      if (response.status === 401) {
        window.localStorage.removeItem("umusareUserToken");
        window.localStorage.removeItem("umusareDriverToken");
        window.localStorage.removeItem("umusareUser");
        if (requestOptions.skipAuthRedirect) {
          throw new Error(payload.message || "Invalid email/phone or password.");
        }
        window.location.href = "login.html";
        throw new Error("Please log in to continue.");
      }
      if (response.status === 403) {
        throw new Error("You are not authorized to view this page.");
      }
      throw new Error(payload.message || "Request failed");
    }

    return payload;
  }

  window.UmusareApi = {
    API_BASE_URL,
    APP_ENV,
    TEST_MODE_ENABLED,
    DEMO_DATA_ENABLED,
    DUMMY_PAYMENTS_ENABLED,
    REAL_PAYMENTS_ENABLED,
    getToken,
    request,
    auth: {
      me: function () { return request("/auth/me"); },
      logout: function () { return request("/auth/logout", { method: "POST" }); }
    },
    drivers: {
      list: function (query) { return request("/drivers" + (query ? "?" + query : "")); },
      profile: function (publicDriverId) { return request("/drivers/" + encodeURIComponent(publicDriverId)); },
      me: function () { return request("/drivers/me"); }
    },
    bookings: {
      mine: function () { return request("/bookings/me"); },
      detail: function (bookingId) { return request("/bookings/" + encodeURIComponent(bookingId)); }
    }
  };

  if (typeof window.UmusareAddTestModeBanner === "function") {
    window.UmusareAddTestModeBanner();
  }
  if (typeof window.UmusareUpdateDemoAccessVisibility === "function") {
    window.UmusareUpdateDemoAccessVisibility();
  }
})();
