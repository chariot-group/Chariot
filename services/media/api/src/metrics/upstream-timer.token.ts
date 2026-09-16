export const MEDIA_UPSTREAM_TIMER = 'MEDIA_UPSTREAM_TIMER';

export type TimeUpstream = {
  measure<T>(
    dependency: 'adventure' | 'session',
    operation: string,
    work: () => Promise<T>,
  ): Promise<T>;
};
