import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { MEDIA_BUCKET } from '@/resources/media/media.constants';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: S3Client;
  private presignClient: S3Client;
  private bucket: string;
  private publicEndpoint: string;
  private presignedTtlSeconds: number;
  private enabled = true;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT');
    const accessKey = this.configService.get<string>('MINIO_ROOT_USER');
    const secretKey = this.configService.get<string>('MINIO_ROOT_PASSWORD');

    if (!endpoint || !accessKey || !secretKey) {
      this.enabled = false;
      this.logger.warn(
        'MinIO is not configured (MINIO_ENDPOINT / MINIO_ROOT_USER / MINIO_ROOT_PASSWORD). Media uploads disabled.',
      );
      return;
    }

    const region = this.configService.get<string>('MINIO_REGION', 'us-east-1');
    const credentials = {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    };

    this.bucket = this.configService.get<string>('MINIO_BUCKET', MEDIA_BUCKET);
    this.publicEndpoint = (
      this.configService.get<string>('MINIO_PUBLIC_URL') ?? endpoint
    ).replace(/\/$/, '');
    this.presignedTtlSeconds = Number.parseInt(
      this.configService.get<string>('MEDIA_PRESIGNED_TTL_SECONDS') ?? '1800',
      10,
    );

    this.client = new S3Client({
      endpoint,
      region,
      credentials,
      forcePathStyle: true,
    });

    this.presignClient = new S3Client({
      endpoint: this.publicEndpoint,
      region,
      credentials,
      forcePathStyle: true,
    });
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async isReady(): Promise<boolean> {
    if (!this.enabled || !this.client) {
      return false;
    }
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return true;
    } catch {
      return false;
    }
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`MinIO bucket "${this.bucket}" is ready`);
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`MinIO bucket "${this.bucket}" created`);
    }
  }

  async putObject(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    this.assertEnabled();
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'private, max-age=300',
      }),
    );
  }

  async deleteObject(key: string): Promise<void> {
    this.assertEnabled();
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async deleteObjects(keys: string[]): Promise<void> {
    const unique = [...new Set(keys.filter(Boolean))];
    await Promise.all(unique.map((key) => this.deleteObject(key)));
  }

  async headObjectSize(key: string): Promise<number> {
    this.assertEnabled();
    try {
      const res = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return res.ContentLength ?? 0;
    } catch {
      return 0;
    }
  }

  async listObjectSizes(
    prefix: string,
  ): Promise<Array<{ key: string; size: number }>> {
    this.assertEnabled();
    const objects: Array<{ key: string; size: number }> = [];
    let token: string | undefined;

    do {
      const res = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: token,
        }),
      );
      for (const obj of res.Contents ?? []) {
        if (obj.Key) {
          objects.push({ key: obj.Key, size: obj.Size ?? 0 });
        }
      }
      token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token);

    return objects;
  }

  async createPresignedGetUrl(objectKey: string): Promise<{
    url: string;
    expiresAt: string;
  }> {
    this.assertEnabled();

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
    });

    const url = await getSignedUrl(this.presignClient, command, {
      expiresIn: this.presignedTtlSeconds,
    });

    const expiresAt = new Date(
      Date.now() + this.presignedTtlSeconds * 1000,
    ).toISOString();

    return { url, expiresAt };
  }

  private assertEnabled(): void {
    if (!this.enabled) {
      throw new Error('MinIO is not configured');
    }
  }
}
