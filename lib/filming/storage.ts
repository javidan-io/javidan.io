import { createReadStream } from "node:fs";
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export function storageConfig() {
  return {
    endpoint: required("S3_ENDPOINT"),
    region: process.env.S3_REGION ?? "us-east-1",
    bucket: required("S3_BUCKET"),
    accessKeyId: required("S3_ACCESS_KEY"),
    secretAccessKey: required("S3_SECRET_KEY"),
  };
}

let client: S3Client | undefined;

export function getStorage() {
  const config = storageConfig();

  client ??= new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: true, // MinIO serves buckets as /bucket/key
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return { client, bucket: config.bucket };
}

/** Creates the bucket if needed and makes objects publicly readable. */
export async function ensurePublicBucket() {
  const { client, bucket } = getStorage();

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
  }

  await client.send(
    new PutBucketPolicyCommand({
      Bucket: bucket,
      Policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${bucket}/*`],
          },
        ],
      }),
    }),
  );
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  const { client, bucket } = getStorage();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

/** Streams a local file with multipart upload, so large videos stay off-heap. */
export async function uploadFile(key: string, file: string, contentType: string) {
  const { Upload } = await import("@aws-sdk/lib-storage");
  const { client, bucket } = getStorage();

  await new Upload({
    client,
    params: {
      Bucket: bucket,
      Key: key,
      Body: createReadStream(file),
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    },
  }).done();
}

export async function deleteObject(key: string) {
  const { client, bucket } = getStorage();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
