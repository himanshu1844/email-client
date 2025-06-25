const { google } = require('googleapis');
const crypto = require('crypto');


const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);


const scopes = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
 
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
];


const getauthrurl = (req, res) => {
  try {
    const clerkUserId=req.query;
    console.log("clerkUserId",clerkUserId);
    const state = crypto.randomBytes(16).toString('hex');
     req.session.oauthState = {
            value: state,
            clerkUserId: clerkUserId,
           
        };
        console.log("state",state);

        req.session.oauthState = { value: state, clerkUserId: clerkUserId };
console.log("Session state saved in memory:", req.session.oauthState);
console.log("Full session object in getauthrurl:", req.session);
console.log("Session ID in getauthrurl:", req.sessionID);

    
    


    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,      
      include_granted_scopes: true,
      prompt: 'consent',
      state: state            
    });

    res.status(200).json({ authURL: authorizationUrl });

  } catch (error) {
    console.error('Error generating Google Auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authentication URL' });
  }
};

module.exports = getauthrurl;
