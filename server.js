const http = require('http');
const express = require('express');
const fetch = require('node-fetch');
const fs = require("fs");
const bodyParser = require("body-parser");


require('dotenv').config();

const app = express();

const port = process.env.PORT || 8000;

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
dbClient.connect().then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));;

//reads file into array and converts to JSON

async function readFiles(dirname, onFileContent) {
  fs.readdir(dirname, function(err, filenames) {
    if (err) {
      throw err;
    }
    filenames.forEach(function(filename) {
      fs.readFile(dirname + filename, 'utf-8', function(err, content) {
        if (err) {
          throw err;
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
  fs.writeFile('./data.json', JSON.stringify(jsonResult), err => {
    // error checking
    if (err) throw err;

    console.log("New data added");
  });

  /*fetch("http://188.166.191.81:8000/push", {
    method: "POST",
    body: JSON.stringify(jsonResult),
    headers: {
      "Content-Type": "application/json"
    }
  });*/
}

//requests from database

async function addDocs(info) {
  const collection = dbClient.db("FireData").collection("NasaFirmsData");

  const options = {
    ordered: true
  };
  //remove old info for new info
  await collection.deleteMany({});
  //post new info
  const result = await collection.insertMany(info);
  console.log(result.insertedCount + 'documents were inserted');
}

app.post("/push", bodyParser.json(), function(req, res) {
  addDocs(req.body).catch(console.dir);
});

app.post("/recieve", async function(req, res) {

});

app.get('/download', function(req, res) {
  /*await fs.unlink("data.json", (err) => {
    if (err) {
      console.error(err)
      return
    }
  });*/
  //console.log("file deleted and ready to rewrite");
  readFiles("/root/FIRMS/viirs/SouthEast_Asia/", pushData);
  const file = `data.json`;
  res.download(file); // Set disposition and send it.
});





app.listen(port, () => console.log(`app listening on port ${port}!`));