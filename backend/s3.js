const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const REGION = process.env.AWS_REGION || "ap-south-1";
const BUCKET = process.env.REPORTS_BUCKET || "iac-analyzer-reports-8addf968";

const s3 = new S3Client({ region: REGION });

async function uploadReport(id, report) {
  const key = `reports/${id}.json`;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: JSON.stringify(report, null, 2),
      ContentType: "application/json",
    })
  );
  return key;
}

module.exports = { uploadReport };