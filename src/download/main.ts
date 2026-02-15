import { parse } from "@std/path";
import { downloadFile, getAccessToken, getDownloadURLs } from "./get.ts";
import type { Options } from "./types.ts";

/**
 * Download zone files from CZDS
 *
 * @param options options
 */
export async function download(options: Options): Promise<void> {
  const outputDirectory = options.out;
  const selectedZones = [...new Set(options.zone)];
  const domainsOnly = options.domains;

  const USERNAME = Deno.env.get("USERNAME");
  const PASSWORD = Deno.env.get("PASSWORD");

  if (!USERNAME) {
    throw new Error("USERNAME environment variable is not set.");
  }

  if (!PASSWORD) {
    throw new Error("PASSWORD environment variable is not set.");
  }

  const accessToken = await getAccessToken(USERNAME, PASSWORD);

  const downloadURLs = await getDownloadURLs(accessToken);

  const inaccessibleZones = selectedZones.filter((t) =>
    !downloadURLs.some((l) => parse(l).name == t)
  );
  if (inaccessibleZones.length) {
    throw new Error(
      `Found inaccessible zones: '${inaccessibleZones.join("', '")}'`,
    );
  }

  const selectedURLs = selectedZones.length
    ? downloadURLs.filter((l) => selectedZones.some((t) => parse(l).name == t))
    : downloadURLs;

  await Deno.mkdir(outputDirectory, { recursive: true });

  for (const url of selectedURLs) {
    await downloadFile(accessToken, url, outputDirectory, domainsOnly);
  }
}
