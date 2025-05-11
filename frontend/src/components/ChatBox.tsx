import React, { useState, useRef, useEffect } from "react";

interface ChatMessage {
  message: string;
  sender: string;
  timestamp: number;
  id?: string; // Optional ID field (will be generated if needed)
}

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  currentUserId?: string;
  currentUsername: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onSendMessage,
  currentUsername,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    onSendMessage(newMessage);
    setNewMessage("");
  };

  return (
    <div className="card h-[600px] flex flex-col">
      <h2 className="text-xl font-bold mb-4">Game Chat</h2>

      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={msg.id || `msg-${index}`}
              className={`flex ${
                msg.sender === currentUsername ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.sender === currentUsername
                    ? "bg-primary text-white rounded-tr-none"
                    : "bg-gray-200 text-gray-800 rounded-tl-none"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`text-xs font-medium ${
                      msg.sender === currentUsername
                        ? "text-white"
                        : "text-gray-600"
                    }`}
                  >
                    {msg.sender}
                  </span>
                  <span
                    className={`text-xs ${
                      msg.sender === currentUsername
                        ? "text-white/70"
                        : "text-gray-500"
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p>{msg.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-auto">
        <div className="flex">
          <input
            type="text"
            className="input rounded-r-none flex-1"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary rounded-l-none px-4"
            disabled={!newMessage.trim()}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
