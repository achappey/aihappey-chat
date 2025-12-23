import React from "react";
import { useTheme } from "aihappey-components";

const ChatView = (props) => {
    const { Chat } = useTheme();
    return React.createElement(Chat, props);
};

export default {
    title: "Chat",
    component: ChatView,
};

export const Default = {
    render: () => React.createElement(ChatView, {
        messages: [
            { id: "1", content: [{ type: "text", text: "Hello" }], role: "user" },
            {
                id: "2", author: "gpt-5.2",
                content: [{ type: "text", text: "Hi there!" }], role: "assistant"
            }
        ],
        renderMessage: (msg) => React.createElement("div", {
        }, [
            React.createElement("strong", { key: "role" }, msg.role.toUpperCase()),
            ": ",
            msg.content[0].text
        ])
    })
};

export const WithReactions = {
    render: () => React.createElement(ChatView, {
        messages: [
            { id: "1", content: [{ type: "text", text: "This message has reactions" }], role: "user" },
            {
                id: "2", author: "gpt-5.2",
                content: [{ type: "text", text: "React to this!" }], role: "assistant"
            }
        ],
        renderMessage: (msg) => React.createElement("div", {
        }, [
            React.createElement("strong", { key: "role" }, msg.role.toUpperCase()),
            ": ",
            msg.content[0].text
        ]),
        renderReactions: (msg) => React.createElement("div", {

        }, "👍 2  👎 1")
    })
};

export const ComplexConversation = {
    render: () => React.createElement(ChatView, {
        messages: [
            { id: "s1", content: [{ type: "text", text: "You are a helpful assistant." }], role: "system" },
            { id: "1", content: [{ type: "text", text: "Explain quantum computing." }], role: "user" },
            {
                id: "2", author: "gpt-5.2",
                content: [{ type: "text", text: "Quantum computing uses quantum mechanics to process information." }], role: "assistant"
            },
            { id: "3", content: [{ type: "text", text: "How is it different from classical?" }], role: "user" },
            {
                id: "4", author: "gpt-5.2",
                content: [{ type: "text", text: "Classical computers use bits (0 or 1), while quantum computers use qubits which can be both 0 and 1 at the same time (superposition)." }], role: "assistant"
            }
        ],
        renderMessage: (msg) => React.createElement("div", {
        }, [
            React.createElement("strong", {
                key: "role", style: {
                }
            }, msg.role),
            ": ",
            msg.content[0].text
        ])
    })
};

export const Empty = {
    render: () => React.createElement(ChatView, {
        messages: [],
        renderMessage: (msg) => React.createElement("div", {}, "Message")
    })
};
