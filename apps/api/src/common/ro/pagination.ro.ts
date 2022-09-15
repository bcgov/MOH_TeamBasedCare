import { ApiProperty } from '@nestjs/swagger';

export class PaginationRO<T> {
  @ApiProperty({ isArray: true })
  result: T[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  count: number;

  constructor(data: [any[], number]) {
    this.total = data && data[1];
    this.count = data[0] ? data[0].length : 0;
    this.result = [];
    this.result = data[0].map(each => {
      return each;
    });
  }
}
