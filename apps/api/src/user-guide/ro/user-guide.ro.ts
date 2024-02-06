import { UserGuide } from '@tbcm/common';
import { ApiModelProperty } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';

export class UserGuideRO implements UserGuide {
  @ApiModelProperty({
    description: 'file name',
    example: 'user-guide.pdf',
  })
  name!: string;

  @ApiModelProperty({
    description: 'last modified date and time',
  })
  lastModified!: Date;

  @ApiModelProperty({
    description: 'file size in bytes',
  })
  size!: number;

  @ApiModelProperty({
    description: 'file version',
  })
  version!: string;
}
