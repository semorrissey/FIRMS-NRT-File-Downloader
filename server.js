const http = require('http');
const express = require('express');
const fetch = require('node-fetch');
const fs = require("fs");
const bodyParser = require("body-parser");

require('dotenv').config();

const app = express();

const port = 3000;

app.use(express.static('public'));
app.use(bodyParser.json({
  limit: '200mb'
}));
app.use(bodyParser.urlencoded({
  limit: '200mb',
  extended: true
}));
app.use(bodyParser.text({
  limit: '200mb'
}));

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/webpage.html");
});

//mongodb connection setup
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://admin:${process.env.DB_PASSWORD}@cluster0.em7pv.mongodb.net/FireData?retryWrites=true&w=majority`;
const dbClient = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});



//requests from database

async function addDocs(info) {
  try {
    await dbClient.connect().then(() => console.log('MongoDB connected...'))
      .catch(err => console.log(err));;

    const collection = dbClient.db("FireData").collection("NasaFirmsData");

    const options = {
      ordered: true
    };

    const result = await collection.insertMany(info);
    console.log(result.insertedCount + 'documents were inserted');
  } finally {
    await dbClient.close();
  }
}

app.post("/push", bodyParser.json(), function(req, res) {
  addDocs(JSON.parse(req.body)).catch(console.dir);
});






app.listen(port, () => console.log(`app listening on port ${port}!`));