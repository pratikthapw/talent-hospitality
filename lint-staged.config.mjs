/**
 * @param {string[]} filenames - Staged file paths.
 * @returns {string[]} File paths passed through for CLI commands.
 */
const toRelativePaths = (filenames) => [...filenames];

/**
 * @param {string} command - Base command to run.
 * @param {string[]} filenames - Staged file paths.
 * @returns {string} Command with quoted file arguments.
 */
const buildCommand = (command, filenames) => {
  const fileArgs = toRelativePaths(filenames).map(JSON.stringify).join(" ");

  return `${command} ${fileArgs}`;
};

/** @param {string[]} filenames - Staged file paths. */
const buildOxlintCommand = (filenames) => buildCommand("pnpm exec oxlint --fix", filenames);

/** @param {string[]} filenames - Staged file paths. */
const buildOxfmtCommand = (filenames) => buildCommand("pnpm exec oxfmt", filenames);

/** @type {import("lint-staged").Configuration} */
const config = {
  "*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}": [buildOxlintCommand, buildOxfmtCommand],
  "*.{json,jsonc,css,scss,html,yml,yaml,toml,graphql,gql}": buildOxfmtCommand,
};

export default config;
