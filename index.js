const express = require("express");
const multer = require("multer");
const multerS3 = require('multer-s3')
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
const gail_bucket = "gail-versioning-test"
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

async function generateGailUploadURL() {
  const rawBytes = await randomBytes(16)  
  const fileName = rawBytes.toString("hex") + ".pdf";

  const params = {
    Bucket: gail_bucket,
    Key: fileName,
    Expires: 60,
  };

  const uploadURL = await s3.getSignedUrlPromise("putObject", params);
  return { url: uploadURL, key: fileName };
}
app.use(express.json());
app.use(express.urlencoded({extended: true}));
var cors = require("cors");
app.use(cors());
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });
// const upload = multer({storage: storage})
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'student-pfps-dino',
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + ".jpeg")
    }
  })
})

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
app.get("/gail-upload", async (req, res) => {
  const url = await generateGailUploadURL();
  res.send(url);
});
app.get('/logs', async (req, res) => {
  try {
    let data = []
    await client.connect()
    const database = client.db("pdfc-logs");
    const compressions = database.collection("compressions");
    const query = {name: req.body.name}
    let cursor = compressions.find()
    await cursor.forEach(doc => data.push(doc))
    // console.log(result) 
    res.send(data)
  }
  catch (e) {
    console.log(e)
  }
})
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
app.get('/students', upload.any(),async (req, res) => {
  try {
    let data = []
    await client.connect()
    const database = client.db("student-form");
    const compressions = database.collection("students");
    const query = {name: req.body.name}
    let cursor = compressions.find()
    await cursor.forEach(doc => data.push(doc))
    // console.log(result) 
    res.send(data)
  }
  catch (e) {
    console.log(e)
  }
  
})
app.post('/student', upload.any() , async (req, res) => {
  const data = req.body
  // console.log(req.files[0].location)
  data["pfp"] = req.files[0].location
  console.log(data)
  await client.connect()
  const db = client.db('student-form')
  const collection = db.collection('students')
  const upload = await collection.insertOne(data)
  console.log(upload)
// TODO parse skills secion into an array
// TODO figure out how to store image

  res.send("console chudu").status(201)
})

app.get('/unique', async (req, res) => {
  await client.connect()
  const db = client.db('student-form')
  const collection = db.collection('students')
  console.log(req.body.studentID)
  const cursor = await collection.find({"studentID" : req.body.studentID.toString()})
  let data = []
  await cursor.forEach(doc => data.push(doc))
  console.log(data)
  console.log(data.length == 0)
  res.send(data.length == 0).status(201)

} )


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