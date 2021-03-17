const http = require('http');
const express = require('express');
const fetch = require('node-fetch');
const fs = require("fs");
const bodyParser = require("body-parser");

require('dotenv').config();

const app = express();

const port = process.env.PORT || 5000;

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

app.get("/libs/require.js", function(req, res) {
  res.sendFile(__dirname + "/libs/require.js");
})

//mongodb connection setup
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://admin:${process.env.DB_PASSWORD}@cluster0.em7pv.mongodb.net/FireData?retryWrites=true&w=majority`;
const dbClient = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

//reads file into array and converts to JSON

function reading() {
  fs.readFile(__dirname + '/files/VIIRS_I_SouthEast_Asia_VNP14IMGTDL_NRT_2021068.txt', 'utf8', function read(err, data) {
    if (err) throw err;
    const info = data.toString();
    var array = info.split("\n");
    var jsonKeys = array[0].split(",");
    array.splice(0, 1);
    var jsonResult = new Array;
    for (i in array) {
      var temp = array[i].split(",");
      var json = {};
      for (j in temp) {
        json[jsonKeys[j]] = temp[j];
      }
      jsonResult.push(json);
    }
    for (k = 0; k < jsonResult.length; k += 100) {
      var payload = new Array;
      var temp = jsonResult.slice(k, k + 100);
      for (l = 0; l < 100; l++) {
        payload.push(temp[l]);
      }
      /*fetch("https://maepingfirepa.herokuapp.com/push", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json"
        }
      });*/
    }
    fetch("http://localhost:3000/push", {
      method: "POST",
      body: JSON.stringify(jsonResult),
      headers: {
        "Content-Type": "application/json"
      }
    });
  });
}

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
  addDocs(req.body).catch(console.dir);
});

app.post("/recieve", function(req, res) {
  reading();
  //res.setStatusCode(200);
})




app.listen(port, () => console.log(`app listening on port ${port}!`));