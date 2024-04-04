import { UserGuide } from '@tbcm/common';
import { ApiProperty } from '@nestjs/swagger';

export class UserGuideRO implements UserGuide {
  @ApiProperty({
    description: 'file name',
    example: 'user-guide.pdf',
  })
  name!: string;

  @ApiProperty({
    description: 'last modified date and time',
  })
  lastModified!: Date;

  @ApiProperty({
    description: 'file size in bytes',
  })
  size!: number;

  @ApiProperty({
    description: 'file version',
  })
  version!: string;
}
