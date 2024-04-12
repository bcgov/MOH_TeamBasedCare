import AWS from 'aws-sdk';
import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { UserGuide } from '@tbcm/common';
import { AppLogger } from 'src/common/logger.service';

const BUCKET_NAME = process.env.DOCS_BUCKET ?? 'tbcm-dev-docs';

@Injectable()
export class UserGuideService {
  private s3: AWS.S3 | null = null;

  constructor(@Inject(Logger) private readonly logger: AppLogger) {
    if (process.env.DOCS_BUCKET) {
      this.s3 = new AWS.S3({
        params: {
          Bucket: BUCKET_NAME,
        },
      });
    }
  }

  async findAll() {
    if (!this.s3) {
      throw new InternalServerErrorException('the feature is disabled');
    }
    try {
      const result = await this.s3.listObjects().promise();

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
    if (!this.s3) {
      throw new InternalServerErrorException('the feature is disabled');
    }
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        VersionId: version,
        Expires: 60,
        ResponseContentDisposition: 'attachment',
      };
      return await this.s3.getSignedUrlPromise('getObject', params);
    } catch (e) {
      this.logger.error(e, 'S3');
      throw new InternalServerErrorException('failed to get the signed url of a user guide');
    }
  }
}
