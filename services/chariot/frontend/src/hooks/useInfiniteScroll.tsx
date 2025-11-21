import { useEffect, useRef } from "react";

const useInfiniteScrollObserver = (
  sentinelRef: React.RefObject<HTMLDivElement | null>,
  fetchNextPage: Function,
  page: number,
  loading: boolean,
  search?: string,
  hasMore?: boolean
) => {
  const didMountRef = useRef(false);

  useEffect(() => {
    if (!sentinelRef.current || loading || !hasMore) return;

    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;

        // Ignore la première intersection pour éviter déclenchement immédiat
        if (!didMountRef.current) {
          didMountRef.current = true;
          return;
        }

        if (entry.isIntersecting) {
          if (hasMore) {
            fetchNextPage(search, page + 1);
          }
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 1.0,
      }
    );

    observer.observe(sentinelRef.current);

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [sentinelRef, loading, hasMore, fetchNextPage, search, page]);
};

export default useInfiniteScrollObserver;