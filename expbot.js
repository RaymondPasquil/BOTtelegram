import TelegramBot from "node-telegram-bot-api";
import { sendResults_5d1 } from "./GameInformation/5d1.mjs";
import { sendResults_vngo1 } from "./GameInformation/vngo1.mjs";
import { sendResults_trxvngo1 } from "./GameInformation/trxvngo1.mjs";
import { sendResults_1k3 } from "./GameInformation/1k3.mjs";
import https from 'https';
import axios from 'axios';

// Replace with your actual bot token
const token = "7219346698:AAFb3ooMiPUUw3qS7E-vzOhdEIoSTU7Ie8E";

// Replace with your admin username
const userName = "@gameresultgroup";

// Replace with your channel's username
const channelUsername = "@gameresultgroup";

// Create an HTTPS agent with the necessary options
const agent = new https.Agent({
  keepAlive: true,
  family: 4
});



// Function to delete any existing webhook
const deleteWebhook = async () => {
  try {
    const response = await axios.post(`https://api.telegram.org/bot${token}/deleteWebhook`, {}, {
      httpsAgent: agent,
    });
    console.log('Webhook deleted:', response.data);
  } catch (error) {
    console.error('Error deleting webhook:', error);
  }
};

// Main function to start the bot
const startBot = async () => {
  await deleteWebhook();

  console.log("Creating bot instance...");

  // Create the bot instance with polling and agent options
  const bot = new TelegramBot(token, {
    polling: {
      interval: 1000,
      autoStart: true,
      params: {
        timeout: 10,
      },
    },
    request: {
      agent: agent,
    },
  });

  console.log("Bot instance created, starting polling...");

  // Every 10 seconds send the messages directly
  setInterval(() => {
    console.log("Sending 5d1 results...");
    sendResults_5d1(bot, channelUsername);
  }, 10 * 1000);

  setInterval(() => {
    console.log("Sending vngo1 results...");
    sendResults_vngo1(bot, channelUsername);
  }, 10 * 1000);

  setInterval(() => {
    console.log("Sending trxvngo1 results...");
    sendResults_trxvngo1(bot, channelUsername);
  }, 10 * 1000);

  setInterval(() => {
    console.log("Sending 1k3 results...");
    sendResults_1k3(bot, channelUsername);
  }, 10 * 1000);

  // Listen for messages
  bot.on("message", async (msg) => {
    console.log("Received message:", msg);
    if (msg.chat.type === "private" && msg.from.username === userName) {
      const messageToSend = msg.caption
        ? msg.caption.trim()
        : msg.text
        ? msg.text.trim()
        : "";

      const buttons = [
        [{ text: "Button1", url: "t.me/YourLink1" }],
        [
          { text: "Button2", url: "t.me/YourLink2" },
          { text: "Button3", url: "t.me/YourLink3" },
        ],
        [
          { text: "Button4", url: "t.me/YourLink4" },
          { text: "Button5", url: "t.me/YourLink5" },
        ],
        [
          { text: "Button6", url: "t.me/YourLink6" },
          { text: "Button7", url: "t.me/YourLink7" },
        ],
        [{ text: "Button8", url: "t.me/YourLink8" }],
      ];

      const options = {
        reply_markup: JSON.stringify({
          inline_keyboard: buttons,
        }),
      };

      // Check if message contains photo
      if (msg.photo && msg.photo.length > 0) {
        const fileId = msg.photo[msg.photo.length - 1].file_id;

        bot
          .sendPhoto(channelUsername, fileId, {
            caption: messageToSend,
            ...options,
          })
          .then(() => {
            console.log("Photo sent successfully");
          })
          .catch((error) => {
            console.error("Error sending photo:", error);
          });
      } else if (messageToSend) {
        bot
          .sendMessage(channelUsername, messageToSend, options)
          .then(() => {
            console.log("Message sent successfully");
          })
          .catch((error) => {
            console.error("Error sending message:", error);
          });
      } else {
        console.log("No text or photo to send");
      }
    }
  });

  // Listen for polling errors
  bot.on("polling_error", (error) => {
    console.error("Polling error:", error);
    if (error.code === "EFATAL") {
      console.log(
        "Encountered 502 Bad Gateway, waiting 1 minute before restarting polling..."
      );
      // Stop polling
      bot.stopPolling();
      // Wait one minute
      setTimeout(() => {
        console.log("Restarting polling...");
        bot.startPolling();
      }, 60000); // 60000ms == 1 minute
    }
  });

  console.log("Polling started...");
};

// Start the bot
startBot();
