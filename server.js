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


//mongodb connection setup
const MongoClient = require('mongodb').MongoClient;
const uri =
  'mongodb+srv://admin:0dn5QCnxK0rqAEND@fire-data-firms.z117n.mongodb.net/FireData?retryWrites=true&w=majority';
const dbClient = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

//reads file into array and converts to JSON

function readFiles(dirname, onFileContent, onError) {
  fs.readdir(dirname, function(err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    filenames.forEach(function(filename) {
      fs.readFile(dirname + filename, 'utf-8', function(err, content) {
        if (err) {
          onError(err);
          return;
        }
        onFileContent(filename, content);
      });
    });
  });
}

function pushData(fname, data) {
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
  fetch("https://firmsnrtdownloader.herokuapp.com/push", {
    method: "POST",
    body: JSON.stringify(jsonResult),
    headers: {
      "Content-Type": "application/json"
    }
  });
}
// fetch from source apis

async function csvDownload() {
  const url = 'https://nrt3.modaps.eosdis.nasa.gov/api/v2/content/archives/FIRMS/README.pdf'; // link to file you want to download
  const path = "/public/tmp/" // where to save a file

  const downloadFile = (async (url, path) => {
    const res = await fetch(url, {
      headers: {
        'Authorization': 'Bearer bWFlcGluZ25vZmlyZTpiV0ZsY0dsdVoyNXZabWx5WlVCbmJXRnBiQzVqYjIwPToxNjE1MjUyMTUxOmEwZTc5OTg4YzI2Yjg5ZTMxZWViYzFlOGI5MzQ4MGFkMzVmNTQwNzQ'
      }
    });
    const fileStream = fs.createWriteStream(path);
    await new Promise((resolve, reject) => {
      res.body.pipe(fileStream);
      res.body.on("error", reject);
      fileStream.on("finish", resolve);
    });
  });
  console.log("i worked");
  return true;
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
    //remove old info for new info
    await dbClient.collection.deleteMany({});
    //post new info
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
  readFiles(__dirname, pushData, function(err) {
    if (err) throw err;
  });
  //res.setStatusCode(200);
})




app.listen(port, () => console.log(`app listening on port ${port}!`));