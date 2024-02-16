const axios = require("axios");
const { generateConfig } = require("./utils");
const { google } = require("googleapis");
const TOKENS_MAP = new Map();
const db = require('./db.js');

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI,
);

async function refreshToken(refreshToken, req_email) {
  try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
          refresh_token: refreshToken,
          client_id: `${process.env.CLIENT_ID}`,
          client_secret: `${process.env.CLIENT_SECRET}`,
          grant_type: 'refresh_token',
      });

      const expirationTime = Date.now() + response.data.expires_in * 1000;
      const userToUpdate = db.getRecordById(req_email);
      userToUpdate.token_data.access_token = response.data.access_token;
      userToUpdate.token_data.expiry_date = expirationTime;
      db.updateRecordById(req_email, userToUpdate);
  } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh token');
  }
}

function isAccessTokenExpired(expiryDate) {
  const currentTimestamp = new Date().getTime();
  return currentTimestamp >= expiryDate;
}

async function auth(req, res) {
  try{
      const url = oAuth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: ['https://www.googleapis.com/auth/gmail.readonly','https://www.googleapis.com/auth/userinfo.email'],
      });
      res.redirect(url);
  }
  catch(err){
      console.log('error', err);
  }
}

async function setTokens(req, res, next){
    try{
        const code = req.query.code;
        const {tokens} = await oAuth2Client.getToken(code);
        const userInfo = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokens.access_token}`);
        db.addRecord({ id: userInfo.data.email, token_data: tokens });
        res.status(200).send("SignIn success");
    }
    catch(err){
        console.log("error",err);
    }
}







async function getInbox(req, res) {
  try {
        const req_email = req.params.email;
        const req_tokens = db.getRecordById(req_email);
        if(req_tokens===undefined)
            return res.send("email not verified");
        if(isAccessTokenExpired(req_tokens.token_data.expiry_date)){
            refreshToken(req_tokens.token_data.refresh_token, req_email);
            req_tokens = db.getRecordById(req_email);
        }

        const today = new Date().toISOString().split('T')[0];
        const url = `https://gmail.googleapis.com/gmail/v1/users/${req_email}/messages?q=in:inbox after:${today}`;
        const token = req_tokens.token_data.access_token;
        const config = generateConfig(url, token);
        const response = await axios(config);

        const messages = response.data.messages;
        const messagePromises = messages.map(message => getMessageDetails(message.id, token, req_email));
        const allMessageDetails = await Promise.all(messagePromises);

        res.json({allMessageDetails});
    } catch (error) {
        console.log(error);
        return error;
    }
}

async function getMessageDetails(messageId, token, req_email) {
    try{
        const getMessageUrl = `https://gmail.googleapis.com/gmail/v1/users/${req_email}/messages/${messageId}`;
        const getMessageConfig = generateConfig(getMessageUrl, token);
        const getMessageResponse = await axios(getMessageConfig);
        const messageDetails = getMessageResponse.data;
      
        // console.log(messageDetails);
        return messageDetails;
    }
    catch(err){
        console.error(error);
    }
}

// async function readMail(req, res) {
//   try {
//         const url = `https://gmail.googleapis.com/gmail/v1/users/${req.params.email}/messages/${req.params.messageId}`;
//         const config = generateConfig(url, token);
//         const response = await axios(config);

//         let data = await response.data;

//         res.json(data);
//     } catch (error) {
//         res.send(error);
//     }
// }


// async function getUser(req, res) {
//   try {
//     const url = `https://gmail.googleapis.com/gmail/v1/users/${req.params.email}/profile`;
//     const { token } = await oAuth2Client.getAccessToken();
//     const config = generateConfig(url, token);
//     const response = await axios(config);
//     res.json(response.data);
//   } catch (error) {
//     console.log(error);
//     res.send(error);
//   }
// }

// async function sendMail(req, res) {
//   try {
//   } catch (error) {
//     console.log(error);
//     res.send(error);
//   }
// }

// async function getDrafts(req, res) {
//   try {
//     const url = `https://gmail.googleapis.com/gmail/v1/users/${req.params.email}/drafts`;
//     const { token } = await oAuth2Client.getAccessToken();
//     const config = generateConfig(url, token);
//     const response = await axios(config);
//     res.json(response.data);
//   } catch (error) {
//     console.log(error);
//     return error;
//   }
// }

module.exports = {
  auth,
  setTokens,
  // getUser,
  // sendMail,
  // getDrafts,
  getInbox,
  // readMail,
};