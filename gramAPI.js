const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input"); // npm i input
const fs = require('fs');
const path = require('path');
require("dotenv").config();

const apiId = Number(process.env.gramApiId);
const apiHash = process.env.gramApiHash;
const stringSession = new StringSession(process.env.gramStrSession); // fill this later with the value from session.save()

const messageJson = fs.readFileSync('data/gramMessages.txt', 'utf8');
const fetchedMessages = JSON.parse(messageJson);

let fetchLastMessage = false;
if (fetchedMessages.length > 0) {
    console.log(fetchedMessages[0].messageId);
    lastMessageId = fetchedMessages[0].messageId;
    fetchLastMessage = true;

    const photos = fs.readdirSync('data/photos');
    for (const photo of photos ){
        fs.unlinkSync('data/photos/' + photo);
    }
}

(async () => {
  console.log("Loading interactive example...");
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.start({
    phoneNumber: async () => await input.text("Please enter your number: "),
    password: async () => await input.text("Please enter your password: "),
    phoneCode: async () =>
      await input.text("Please enter the code you received: "),
    onError: (err) => console.log(err),
  });
  console.log("You should now be connected.");

// Actions:     
    try {
        // await client.connect();
        const messages = [];
        const targetDate = new Date("2023-11-09");
        const targetTimestamp = Math.floor(targetDate.getTime() / 1000);
        let messagesCount = 0
        for await (const message of client.iterMessages("good2gosg")) {
            messagesCount += 1;
            console.log(`
            adding messages
            `);  
            // console.log(message.message, message.date); 
            console.log(fetchLastMessage);
            if (fetchLastMessage) {
              console.log('check fetchedMessages');
              if (message.id === lastMessageId){
                  console.log('found the last message');
                  break;
              }
            }
            else {
              if (messagesCount > 10) {
                console.log('reached the limit');
                break;
              }
            }
            const timestamp = message.date; // replace this with your Unix timestamp
            const messageDate = new Date(timestamp * 1000);
            const formattedDate = `${messageDate.toLocaleDateString()} ${messageDate.toLocaleTimeString()}`;
            const msg = {
                messageId: message.id,
                message: message.message,
                date: formattedDate,
                forwards: message.forwards, 
                reactions: message.reactions,
            }
            if (message.media){
                // console.log('there is a media')
                // console.log(message.media);
                if (message.media.className === 'MessageMediaPhoto'){
                    // console.log('this is a photo')
                    message.mediaFilePath = await client.downloadMedia(message.media);
                    const photoPath = path.join(__dirname, 'data/photos', `${message.id}.jpg`);
                    fs.writeFileSync(photoPath, message.mediaFilePath);
                    msg.photoPath = photoPath;
                }
            }
            messages.push(msg);
            }
        console.log('messages', messages);
        const messageJson = JSON.stringify(messages, null, 2);
        messagePath = path.join(__dirname, 'data', 'gramMessages.txt');
        fs.writeFileSync(messagePath, messageJson);
    }
    catch(error) {
      console.log('errormessage', error.message);
    } finally {
      try {
        await client.disconnect();
        console.log('Disconnected successfully');
        process.exit(); // Terminate the program execution
      } catch (error) {
        console.error('Error disconnecting:', error.message);
      }
    }
})();
