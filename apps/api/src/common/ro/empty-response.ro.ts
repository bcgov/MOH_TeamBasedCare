import { ApiProperty } from '@nestjs/swagger';

export class EmptyResponse {
  @ApiProperty({
    description: `
      This Response returns an acknowledgmenent
      that the request has been fulfilled.
    `,
    example: {},
    nullable: false,
    required: true,
  })
  data!: {};

  static get(): EmptyResponse {
    return new EmptyResponse();
  }
}
