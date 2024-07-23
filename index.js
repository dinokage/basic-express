const express = require("express");
const multer = require("multer");
const app = express();
const axios = require('axios').default;
// const {generateUploadURL} = require('./apicall')
const aws = require("aws-sdk");
const crypto = require("crypto");
const { promisify } = require("util");
const randomBytes = promisify(crypto.randomBytes);
const { MongoClient } = require("mongodb");

require("dotenv").config();

const client = new MongoClient(process.env.MONGO_URI);

const region = "ap-south-1";
const bucketName = "dinokagepdftest";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new aws.S3({
  region,
  accessKeyId,
  secretAccessKey,
  signatureVersion: "v4",
});
async function generateUploadURL() {
  const rawBytes = await randomBytes(16);
  const imageName = rawBytes.toString("hex") + ".pdf";

  const params = {
    Bucket: bucketName,
    Key: imageName,
    Expires: 60,
  };

  const uploadURL = await s3.getSignedUrlPromise("putObject", params);
  return { url: uploadURL, key: imageName };
}
app.use(express.json());
app.use(express.urlencoded());
var cors = require("cors");
app.use(cors());
// Middleware to log the entire request object
app.use((req, res, next) => {
  // console.log(req)
  console.log("--- Request ---");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", req.headers);
  // console.log('Query:', req.query);
  // console.log('Parameters:', req.params); // For route parameters (if any)
  console.log("Body:", req.body); // Parsed JSON body (if applicable)
  console.log("--- End Request ---");
  next(); // Pass control to the next middleware or route handler
});

// Example route handler (can be replaced with your actual routes)
app.get("/", (req, res) => {
  res.send("Hello from the API!");
});
app.get("/upload", async (req, res) => {
  const url = await generateUploadURL();
  res.send(url);
});

app.post("/check", async (req, res) => {
   try {
    await client.connect()
    
    const database = client.db("pdfc-logs");
    const compressions = database.collection("compressions");
    const query = {name: req.body.name}
    const result = await compressions.findOne(query)
    console.log(result)
    
    res.send(result)
    
  }
  catch (e) {
    console.log(e)
  }
  finally {
    client.close()
  }
} )

app.get("/addlog", async (req, res) => {
  const fileName = req.body.name;
  console.log(fileName)
  try {
    await client.connect();
    const database = client.db("pdfc-logs");
    const compressions = database.collection("compressions");

    const result = await compressions.insertOne(req.body);
    console.log(result);
  } catch (e) {
    console.log(e);
  } finally {
    client.close();
  }
  res.send("added record");
});
app.post("/", (req, res) => {
  res.send("POST request received. check console");
});
app.get('/axioscheck', async (req, res) => {
  const result = axios.post('http://localhost:5125',{
    name: "munda"
  })  
})

// Start the server
const port = process.env.PORT || 5125;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});