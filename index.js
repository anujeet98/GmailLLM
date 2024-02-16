require("dotenv").config();
const express = require("express");
const routes=require("./routes");
const cors = require('cors');
const app = express();

app.use(cors({
  origin: ['http://localhost:8000']
}));
app.listen(process.env.PORT, () => {
  console.log("listening on port " + process.env.PORT);
});

app.get("/", async (req, res) => {
  // const result=await sendMail();
  res.send("Welcome to Gmail API with NodeJS");
});


app.use('/api',routes);