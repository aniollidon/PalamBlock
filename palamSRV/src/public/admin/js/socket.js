const authUser = localStorage.getItem("user");
const authToken = localStorage.getItem("authToken");

const socket = io(':4000', {
    query: {
        user: authUser,
        authToken: authToken
    },
    path: '/ws-admin',
});

export {socket};
