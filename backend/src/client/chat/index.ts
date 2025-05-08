import { socket } from "../socket";
import type { ChatMessage } from "../../types/global";

const roomId = document.querySelector<HTMLInputElement>("input#userId")?.value;
const parent = document.querySelector("section#chat div");
const messageInput = document.querySelector<HTMLInputElement>("section#chat form input[name=message]");

console.log("Chat room ID linked:", roomId);


document.querySelector("section#chat form.chat-form")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const message = messageInput?.value;
    messageInput!.value = "";

    if(message?.trim().length === 0) {
        return; 
    }

    console.log("Sending message", message);
    console.log("Room ID", roomId);
    
    fetch(`/chat/${roomId}`, {
        method: "post",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
            message
        }),
    });

    });
socket.on(`chat-message:${roomId}`, ({message, sender, timestamp}:ChatMessage)  => {
    const container = document.createElement("div");
    container.className = "chat-message";

    const displayTime = document.createElement("span");
    displayTime.className = "chat-timestamp";
    displayTime.innerText = new Date(timestamp).toLocaleTimeString();

    const senderText = document.createElement("span");
    senderText.className = "chat-sender";
    senderText.innerText = sender;

    const messageText = document.createElement("span");
    messageText.innerText = message;

    // Add spaces between elements
    const space1 = document.createTextNode(" | ");
    const space2 = document.createTextNode(" | ");

    container.appendChild(displayTime);
    container.appendChild(space1);
    container.appendChild(senderText);
    container.appendChild(space2);
    container.appendChild(messageText);
    
    parent?.appendChild(container);
    parent?.scrollTo({top: parent.scrollHeight, behavior: "smooth"});

});