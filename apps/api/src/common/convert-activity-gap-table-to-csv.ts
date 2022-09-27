import { AppModule } from 'src/app.module';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppLogger } from '../common/logger.service';
const { parse } = require('json2csv');

export const convertActivityGapTableToCSV = (data: any) => {
  try {
    const fields = data.headers.map((element: string | { label: string; value: string }) => {
      if (element === 'Activities Bundle') return { label: 'Activities Bundle', value: 'name' };
      return element;
    });

    const emptyRow = {
      ...data.headers.reduce((acc: any, curr: any) => ((acc[curr] = ''), acc), {}),
      name: '',
    };
    const options = { fields };

    const resultData = data.data
      .map((element: any) => {
        const { careActivities, ...remainder } = element;
        return [{ ...emptyRow, name: remainder.name }, ...careActivities, emptyRow];
      })
      .flat();

    const csv = parse(resultData, options);
    return csv;
  } catch (err) {
    (async () => {
      const appContext = await NestFactory.createApplicationContext(AppModule);
      const logger: AppLogger = appContext.get(Logger);
      logger.error(err);
    })();
  }
};
