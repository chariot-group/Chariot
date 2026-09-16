import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Histogram } from 'prom-client';
import { TimeUpstream } from '@/metrics/upstream-timer.token';

@Injectable()
export class UpstreamTimerService implements TimeUpstream {
  constructor(
    @InjectMetric('chariot_media_upstream_duration_seconds')
    private readonly histogram: Histogram<string>,
  ) {}

  async measure<T>(
    dependency: 'adventure' | 'session',
    operation: string,
    work: () => Promise<T>,
  ): Promise<T> {
    const end = this.histogram.startTimer({ dependency, operation });
    try {
      return await work();
    } finally {
      end();
    }
  }
}
