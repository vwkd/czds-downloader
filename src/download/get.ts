import { join } from "@std/path";
import { TextLineStream } from "@std/streams";
import { parse } from "content-disposition";
import { createDomainExtractorStream } from "./utils.ts";

const AUTH_BASE_URL = "https://account-api.icann.org";
const CZDS_BASE_URL = "https://czds-api.icann.org";

/**
 * Get access token
 *
 * @param username username
 * @param password password
 * @returns access token
 */
export async function getAccessToken(
  username: string,
  password: string,
): Promise<string> {
  console.debug(`Getting access token...`);

  const url = join(AUTH_BASE_URL, "/api/authenticate");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Authentication failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();

  if (data.message != "Authentication Successful") {
    throw new Error(`Authentication failed: ${data.message}`);
  }

  return data.accessToken;
}

/**
 * Get download URLs of accessible zones
 *
 * @param accessToken access token
 * @returns download URLs of accessible zones
 */
export async function getDownloadURLs(accessToken: string): Promise<string[]> {
  console.debug(`Getting download URLs...`);

  const url = join(CZDS_BASE_URL, "/czds/downloads/links");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get zone URLs: ${response.status} ${response.statusText}`,
    );
  }

  const urls = await response.json();

  return urls;
}

/**
 * Download zone file
 *
 * - assume is gzip compressed
 *
 * @param accessToken access token
 * @param url download URL
 * @param directory directory for file
 * @param domainsOnly parse out domains only
 */
export async function downloadFile(
  accessToken: string,
  url: string,
  directory: string,
  domainsOnly?: boolean,
): Promise<void> {
  console.debug(`Downloading ${url}...`);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to download zone file: ${response.status} ${response.statusText}`,
    );
  }

  if (!response.body) {
    throw new Error("Got empty body.");
  }

  const dispositionHeader = response.headers.get("content-disposition");
  const disposition = parse(dispositionHeader);
  const filename = disposition.parameters.filename;

  if (!(disposition.type == "attachment" && filename)) {
    throw new Error("Unexpected content-disposition header.");
  }

  if (domainsOnly) {
    const filepath = join(directory, filename.slice(0, -3));
    const file = await Deno.create(filepath);

    await response.body
      .pipeThrough(new DecompressionStream("gzip"))
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream())
      .pipeThrough(createDomainExtractorStream())
      .pipeThrough(new TextEncoderStream())
      .pipeTo(file.writable);
  } else {
    const filepath = join(directory, filename);
    const file = await Deno.create(filepath);

    await response.body.pipeTo(file.writable);
  }
}
