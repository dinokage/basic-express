// import * as crypto from 'crypto';
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
  const imageName = rawBytes.toString('hex')

  const params = ({
    Bucket: bucketName,
    Key: imageName,
    Expires: 60
  })
  
  const uploadURL = await s3.getSignedUrlPromise('putObject', params)
  return uploadURL
}
// const formData = new FormData();
// formData.append('id', 1);
// formData.append('string', 'Text we want to add to the submit');
// formData.append('yinyang.png', fs.createReadStream('./le-sserafim-easy-all-members-sheer-myrrh-hd-wallpaper-uhdpaper.com-156@0@j.jpg'));
// const zum = async () => {const res = await axios.put(generateUploadURL(), body: , {
//   headers: formData.getHeaders()
// })
// console.log(res)}

// zum()

module.exports = generateUploadURL()