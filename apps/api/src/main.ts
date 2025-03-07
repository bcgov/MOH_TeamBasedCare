import { createNestApp } from './app.config';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const { app } = await createNestApp();
  app.enableCors();
  app.use(bodyParser.json({ limit: '25mb' }));
  app.use(bodyParser.urlencoded({ limit: '25mb', extended: true }));
  await app.init();
  await app.listen(process.env.APP_PORT || 4000);
}
bootstrap();
