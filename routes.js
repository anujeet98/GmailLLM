const express = require('express');
const controllers=require('./controllers');
const router = express.Router();

router.get('/auth',controllers.auth);
router.get('/token',controllers.setTokens);

router.get('/mail/inbox/:email', controllers.getInbox);
// router.get('/mail/user/:email',controllers.getUser);
// router.get('/mail/send',controllers.sendMail);
// router.get('/mail/drafts/:email', controllers.getDrafts);

// router.get('/mail/inbox/:email', controllers.getInbox);
// router.get('/mail/read/:messageId', controllers.readMail);

module.exports = router;