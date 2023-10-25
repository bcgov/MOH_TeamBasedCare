import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuthModule } from 'src/auth/auth.module';
import { AppModule } from '../app.module';
import { CareActivityModule } from '../care-activity/care-activity.module';
import { OccupationModule } from '../occupation/occupation.module';
import { PlanningSessionModule } from '../planning-session/planning-session.module';
import { UnitModule } from '../unit/unit.module';

export const Documentation = (app: INestApplication) => {
  const options = new DocumentBuilder()
    .setTitle('TBCM API Documentation')
    .setDescription('API')
    .setVersion(`1.0.0`)
    .addBearerAuth()
    .build();

  const baseDocument = SwaggerModule.createDocument(app, options, {
    include: [
      AppModule,
      UnitModule,
      PlanningSessionModule,
      CareActivityModule,
      OccupationModule,
      AuthModule,
    ],
  });

  SwaggerModule.setup('api', app, baseDocument, {
    swaggerOptions: {
      docExpansion: 'none',
      displayRequestDuration: true,
      operationsSorter: 'alpha',
      tagsSorter: 'alpha',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
  });
};
