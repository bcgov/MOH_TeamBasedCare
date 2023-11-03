export class PaginationRO<T> {
  result: T[];

  total: number;

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
