const { google } = require('googleapis');
const url = require('url');
const crypto = require('crypto'); 
const prisma = require('../../db/db.js'); 
const axios=require("axios");


const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const callbackhandler = async (req, res) => {
    console.log("Session state saved in memory:", req.session.oauthState);
    console.log("Full session object in callback:", req.session);
    console.log("Session ID in callback:", req.sessionID);
    try {
        let q = url.parse(req.url, true).query;
         const returnedState = q.state;
        const storedStateData = req.session.oauthState;
         const clerkUserId = storedStateData.clerkUserId.clerkUserId;
         
         console.log("clerkUserId", clerkUserId);
         if(!clerkUserId){
            console.error('clerkuserid is not present in session.');
           res.status(500).send('clerkuserid is not present.');
         }


        if (q.error) {
            console.error('OAuth Callback Error:', q.error);
            return res.status(400).send(`Authentication error: ${q.error}. Please try again.`);
        }

     
        const { tokens } = await oauth2Client.getToken(q.code);
        oauth2Client.setCredentials(tokens); 
        console.log('Authentication successful! Tokens received (access_token, refresh_token, expiry_date):', tokens,tokens.refresh_token);

    
        const people = google.people({
            version: 'v1',
            auth: oauth2Client,
        });

        const profileResponse = await people.people.get({
            resourceName: 'people/me',
            personFields: 'names,emailAddresses,metadata', 
        });

        const profile = profileResponse.data;
        const userDetails = {};

       
        if (profile.names && profile.names.length > 0) {
        
            const primaryName = profile.names.find(name => name.metadata && name.metadata.primary);
            userDetails.name = primaryName ? primaryName.displayName : profile.names[0].displayName;
        }

        
        if (profile.emailAddresses && profile.emailAddresses.length > 0) {
            
            const primaryEmail = profile.emailAddresses.find(email => email.metadata && email.metadata.primary);
            userDetails.email = primaryEmail ? primaryEmail.value : profile.emailAddresses[0].value;
        }

       
        if (profile.metadata && profile.metadata.sources) {
          
            const googleSource = profile.metadata.sources.find(source => source.type === 'PROFILE');
            if (googleSource) {
                userDetails.id = googleSource.id;
            }
        }

        console.log('Fetched User Details:', userDetails);
        //  delete req.session.oauthState;
         console.log("userId", clerkUserId);
         
         await prisma.account.upsert({
          where:{id:userDetails.id},
          create:{
            id: userDetails.id,
            userId: clerkUserId, 
            
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
          
            emailAddress: userDetails.email || null,
            name: userDetails.name || null
          },
          update:{
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
          
           
          }
        });

       

      
        
        try {
            console.log("Starting initial sync for user:", userDetails.id);
            const response=await axios.get("http://localhost:3000/api/google/initial_sync",{
                accountId:userDetails.id,
                userId:clerkUserId,
            });
            console.log("resonse.data",response.data);
           
            if(!response.data.success){
                console.error("Initial sync failed:", response.data.message);

                return res.status(400).send("initial sync failed");
            }
            
            
            
        } catch (error) {
            console.log(error.response.data);
            
        }
         res.redirect(`http://localhost:3000/mail`);
        

    } catch (error) {
        console.error('Error during OAuth callback process or fetching user details:', error);
     
        res.status(500).send('Authentication failed: An internal server error occurred.');
    }
};



module.exports = callbackhandler;
 

