export interface Options {
  /**
   * Parse out domains only
   */
  domains?: boolean;
  /**
   * Output directory
   */
  out: string;
  /**
   * Zone TLDs
   */
  zone: string[];
}
