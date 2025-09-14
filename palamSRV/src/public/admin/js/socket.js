const authUser = localStorage.getItem("user");
const authToken = localStorage.getItem("authToken");

// Connect to the same origin the page is served from (works behind reverse proxies / Cloudflare)
const socket = io({
  query: {
    user: authUser,
    authToken: authToken,
  },
  path: "/ws-admin",
  // Prefer WebSocket first to avoid long-polling issues through tunnels
  transports: ["websocket", "polling"],
});

export { socket };
