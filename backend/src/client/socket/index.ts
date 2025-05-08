import io from "socket.io-client"; 

const socket = io();

export {socket}; // Export the socket instance for use in other modules