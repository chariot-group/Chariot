import { Module } from "@nestjs/common";

/**
 * Module de métriques simplifié.
 * Les métriques sont exposées via PrometheusModule configuré dans AppModule.
 * Ce module est conservé pour maintenir la structure modulaire du projet.
 */
@Module({
  providers: [],
  exports: [],
})
export class MetricsModule {}
