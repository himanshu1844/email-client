const { google } = require('googleapis');
const url = require('url');
const prisma = require('../../db/db.js'); 
const axios = require("axios");
const  savetodb  = require('./sync_database.js'); 

const getoauth2Cilent = async (accountId, userId) => {
    const account = await prisma.account.findFirst({
        where: {
           id: accountId,
           userId: userId,
        }
    });
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({
        refresh_token: account.refreshToken,
        access_token: account.accessToken,
    })
    await oauth2Client.refreshAccessToken();
    return oauth2Client;
}

const batchGetMessages = async (oauth2Client, messageIds, email) => {
    try {
  
        const accessToken = oauth2Client.credentials.access_token;
        
    
        let batchBody = '';
        const boundary = 'batch_';
        console.log(`[${email}] Using boundary: ${boundary}`);
        
        messageIds.forEach((messageId, index) => {
            batchBody += `--${boundary}\r\n`;
            batchBody += `Content-Type: application/http\r\n`;
            batchBody += `Content-ID: ${index + 1}\r\n\r\n`;
            batchBody += `GET /gmail/v1/users/me/messages/${messageId}?format=full\r\n`;
            batchBody += `Authorization: Bearer ${accessToken}\r\n\r\n`;
        });
        
        batchBody += `--${boundary}--\r\n`;
        
        
        const response = await axios.post('https://gmail.googleapis.com/batch/gmail/v1', batchBody, {
            headers: {
                'Content-Type': `multipart/mixed; boundary=${boundary}`,
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
       
        const messagesToSave = [];
        const responseData = response.data;
        if(responseData) {
            console.error(`[${email}] response data received from batch request.`);
        }
        // console.log(responseData);
        
    
        const parts = responseData.split(`--${boundary}`);
        console.log(`[${email}] Split response into ${parts.length} parts.`);
        
        parts.forEach((part, index) => {
            if (part.includes('HTTP/1.1 200 OK')) {
                try {
                    
                    const jsonStart = part.indexOf('{');
                    
                    const jsonEnd = part.lastIndexOf('}');

                    if(jsonStart !== -1 && jsonEnd!==-1 && jsonEnd>jsonStart) {
                        const jsonString = part.substring(jsonStart,jsonEnd+1).trim();
                        // console.log(`[${email}] JSON string for part ${index}:`, jsonString);
                        try {

                            const messageData = JSON.parse(jsonString);
                            // console.log(`[${email}] Parsed message data for part ${index}:`, messageData);
                            if(messageData && messageData.id) {
                                messagesToSave.push(messageData);
                            }
                        
                      } catch (error) {
                            console.error(`[${email}] Error parsing JSON for part ${index}:`, error.message);
                        
                      }

                    }
     
                } catch (parseError) {
                    console.error(`[${email}] Failed to parse message data:`, parseError.message);
                }
            } else if (part.includes('HTTP/1.1') && !part.includes('200 OK')) {
                console.error(`[${email}] Failed to fetch message in batch part ${index}`);
            }
        });
        
        return messagesToSave;
        
    } catch (error) {
        console.error(`[${email}] Error in batch get messages:`, error.message);
     
    }
};

const initialsynchandler = async (req, res) => {
    const accountId = req.body.accountId;
    const userId = req.body.userId;
    console.log("initial sync handler called");
    console.log("accountId:", accountId);
    console.log("userId:", userId);

    const account = await prisma.account.findFirst({
        where: {
           id: accountId,
           userId: userId,
        }
    });
    const email = account.emailAddress;

    if (!email) {
        return res.status(400).json({ success: false, error: 'User email is required.' });
    }
    
    try {
        const oauth2Client = await getoauth2Cilent(accountId, userId);
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });  
        let pagetoken = null;
        let latestOverallHistoryId = null;
        let totalmessage = 0;
        
        do {
            const lisres = await gmail.users.messages.list({
                userId: 'me',
                maxResults: 10,
                pageToken: pagetoken,
                q: 'newer_than:3d'
            });
            
            const messagelist = lisres.data.messages || [];
            console.log(`[${email}] Fetched ${messagelist.length} messages from Gmail API.`);
            
            if (messagelist.length > 0) {
                const messageIds = messagelist.map(msg => msg.id);
                
                // Use batch request to get messages
                const messagesToSave = await batchGetMessages(oauth2Client, messageIds, email);
                
            
                    // console.log("Message", JSON.stringify(msg, null, 2));
                    await savetodb(messagesToSave, accountId);
                    
                    
                
            }
            
            pagetoken = lisres.data.nextPageToken;
            console.log(`[${email}] Next page token: ${pagetoken}`);
            
        } while (pagetoken);
        
        try {
            const historyRes = await gmail.users.history.list({
                userId: 'me',
                startHistoryId: '1', 
                maxResults: 1 
            });
            latestOverallHistoryId = historyRes.data.historyId;
            console.log(`[${email}] Latest overall history ID for mailbox: ${latestOverallHistoryId}`);
            
            // await updateGmailHistoryId(email, latestOverallHistoryId);

        } catch (historyError) {
            console.warn(`[${email}] Could not fetch latest historyId directly: ${historyError.message}. This might impact future incremental syncs.`);
        }

        console.log(`[${email}] Full Gmail sync completed. Total messages synced: ${totalmessage}`);
        res.status(200).json({ success: true, message: 'Initial sync complete', totalmessage });

    } catch (error) {
        console.error(`[${email}] Error during initial Gmail sync:`, error.message);
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = initialsynchandler;