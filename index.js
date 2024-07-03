const express = require('express');
const multer = require('multer');
const app = express();
// const {generateUploadURL} = require('./apicall')
const aws = require('aws-sdk')
const crypto = require('crypto')
const { promisify } = require("util")
const randomBytes = promisify(crypto.randomBytes)

require('dotenv').config();

const region = "ap-south-1"
const bucketName = "upload-pdf-dino"
const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

const s3 = new aws.S3({
  region,
  accessKeyId,
  secretAccessKey,
  signatureVersion: 'v4'
})
async function generateUploadURL() {
  const rawBytes = await randomBytes(16)
  const imageName = rawBytes.toString('hex')+".pdf"

  const params = ({
    Bucket: bucketName,
    Key: imageName,
    Expires: 60
  })
  
  const uploadURL = await s3.getSignedUrlPromise('putObject', params)
  return {url: uploadURL, key: imageName}
}
app.use(express.json());
var cors = require('cors');
app.use(cors());
// Middleware to log the entire request object
app.use((req, res, next) => {
    // console.log(req)
  console.log('--- Request ---');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  // console.log('Query:', req.query);
  // console.log('Parameters:', req.params); // For route parameters (if any)
  console.log('Body:', req.body); // Parsed JSON body (if applicable)
  console.log('--- End Request ---');
  next(); // Pass control to the next middleware or route handler
});

// Example route handler (can be replaced with your actual routes)
app.get('/', (req, res) => {
  res.send('Hello from the API!');
});
app.get('/upload', async (req, res) => {
  const url = await generateUploadURL()
  res.send(url);
});

app.post('/', (req, res) => {
    res.send("POST request received. check console")
})

// Start the server
const port = process.env.PORT || 5125;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
