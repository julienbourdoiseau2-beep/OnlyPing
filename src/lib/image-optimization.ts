const OPTIMIZABLE_HOSTS = [/^images\.unsplash\.com$/, /\.r2\.dev$/];

/**
 * Avatars and thumbnails accept arbitrary pasted URLs, so we can't blindly run
 * every image through next/image's optimizer (it throws for hosts that
 * aren't allow-listed in next.config.mjs). Only known hosts we actually
 * control - our own R2 bucket and the Unsplash seed data - get optimized;
 * anything else (a local "/" path, or an unknown external URL) is served as-is.
 */
export function isOptimizableImageUrl(src: string): boolean {
  if (src.startsWith("/")) {
    return true;
  }

  try {
    const { hostname } = new URL(src);
    return OPTIMIZABLE_HOSTS.some((pattern) => pattern.test(hostname));
  } catch {
    return false;
  }
}
