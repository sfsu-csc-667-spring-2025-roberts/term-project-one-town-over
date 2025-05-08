import { socket } from "../socket";
console.log("hello from games index.ts");
// Get current gameId and player list container
const gameId = (document.querySelector('input#userId') as HTMLInputElement)?.value;
const playerList = document.querySelector('#player-list');



if (gameId && playerList) {
  socket.on(`game:${gameId}:player-joined`, ({ email, userId }) => {
    const li = document.createElement('li');
    li.textContent = `${email} (ID: ${userId})`;
    playerList.appendChild(li);
  });

  socket.on(`game:${gameId}:player-left`, ({ userId }) => {
    console.log("Received player-left event", userId);
    const items = playerList.querySelectorAll('li');
    for (const item of items) {
      if (item.textContent && item.textContent.includes(`ID: ${userId}`)) {
        item.remove();
        break;
      }
    }
  });
}