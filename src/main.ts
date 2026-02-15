import { Command } from "commander";
import { download } from "./download/main.ts";

const program = new Command();

program
  .name("czds-downloader")
  .description("Download zone files from CZDS")
  .version("0.0.1");

program
  .command("download")
  .description("Download zone files")
  .requiredOption("-o --out <path>", "output directory")
  .option("-z, --zone <string...>", "TLD of zone (all if not given)", [])
  .action((options) => download(options));

program.parse();
