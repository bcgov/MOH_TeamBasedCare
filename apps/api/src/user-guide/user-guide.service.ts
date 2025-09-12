import { S3Client, ListObjectsCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { UserGuide } from '@tbcm/common';
import { AppLogger } from 'src/common/logger.service';

const BUCKET_NAME = process.env.DOCS_BUCKET ?? 'tbcm-dev-docs';

@Injectable()
export class UserGuideService {
  private s3Client: S3Client | null = null;

  constructor(@Inject(Logger) private readonly logger: AppLogger) {
    if (process.env.DOCS_BUCKET) {
      this.s3Client = new S3Client({});
    }
  }

  async findAll() {
    if (!this.s3Client) {
      throw new InternalServerErrorException('the feature is disabled');
    }
    try {
      const command = new ListObjectsCommand({ Bucket: BUCKET_NAME });
      const result = await this.s3Client.send(command);

      return (
        result.Contents?.map(o => {
          return { name: o.Key, lastModified: o.LastModified, size: o.Size } as UserGuide;
        }) ?? []
      );
    } catch (e) {
      this.logger.error(e, 'user-guide.service.ts:findAll:s3');
      throw new InternalServerErrorException('failed to get the list of user guides');
    }
  }

  async getSignedUrl(key: string, version?: string) {
    if (!this.s3Client) {
      throw new InternalServerErrorException('the feature is disabled');
    }
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        VersionId: version,
        ResponseContentDisposition: 'attachment',
      });
      return await getSignedUrl(this.s3Client, command, { expiresIn: 60 });
    } catch (e) {
      this.logger.error(e, 'S3');
      throw new InternalServerErrorException('failed to get the signed url of a user guide');
    }
  }
}
