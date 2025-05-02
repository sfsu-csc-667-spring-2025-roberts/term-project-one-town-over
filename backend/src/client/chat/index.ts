import { socket } from "../socket";
import type { ChatMessage } from "../../types/global";

const parent = document.querySelector("section#chat div");
const messageInput = document.querySelector<HTMLInputElement>("section#chat form input[name=message]");




document.querySelector("section#chat form.chat-form")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const message = messageInput?.value;
    messageInput!.value = "";

    console.log("Sending message", message);
    
    fetch("/chat/0", {
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
socket.on("chat-message:0", ({message, sender, timestamp}:ChatMessage)  => {
    const container = document.createElement("div");
    container.className = "chat-message";

    const displayTime = document.createElement("span");
    displayTime.className = "chat-timestamp";
    displayTime.innerText = new Date(timestamp).toLocaleTimeString();

    const messageText = document.createElement("span");
    messageText.innerText = message;

    container.appendChild(displayTime);
    container.appendChild(messageText);

    
    parent?.appendChild(container);
    parent?.scrollTo({top: parent.scrollHeight, behavior: "smooth"});

});