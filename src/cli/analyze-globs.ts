import { async } from "fast-glob";
import { existsSync, lstatSync } from "fs";
import { join } from "path";
import { Diagnostic, flattenDiagnosticMessageText, Program, SourceFile } from "typescript";
import { flatten } from "../lit-analyzer/util/util";
import { CompileResult, compileTypescript } from "./compile";

const IGNORE_GLOBS = ["!**/node_modules/**", "!**/web_modules/**"];
//const DEFAULT_DIR_GLOB = "{,!(node_modules|web_modules)/}**/*.{js,jsx,ts,tsx}";
const DEFAULT_DIR_GLOB = "**/*.{js,jsx,ts,tsx}";
//const DEFAULT_FILE_GLOB = "**/*.{js,jsx,ts,tsx}";

const DEFAULT_GLOBS = [DEFAULT_DIR_GLOB]; //, DEFAULT_FILE_GLOB];

export interface AnalyzeGlobsContext {
	didExpandGlobs?(filePaths: string[]): void;
	willAnalyzeFiles?(filePaths: string[]): void;
	didFindTypescriptDiagnostics?(diagnostics: ReadonlyArray<Diagnostic>, options: { program: Program }): void;
	analyzeSourceFile?(file: SourceFile, options: { program: Program }): void;
}

/**
 * Parses and analyses all globs and calls some callbacks while doing it.
 * @param globs
 * @param context
 */
export async function analyzeGlobs(globs: string[], context: AnalyzeGlobsContext = {}): Promise<CompileResult> {
	// Set default glob
	if (globs.length === 0) {
		globs = DEFAULT_GLOBS;
	}

	// Expand the globs
	const filePaths = await expandGlobs(globs);

	// Callbacks
	if (context.didExpandGlobs != null) context.didExpandGlobs(filePaths);
	if (context.willAnalyzeFiles != null) context.willAnalyzeFiles(filePaths);

	// Parse all the files with typescript
	const { program, files, diagnostics } = compileTypescript(filePaths);

	if (diagnostics.length > 0) {
		console.dir(diagnostics.map(d => `${(d.file && d.file.fileName) || "unknown"}: ${flattenDiagnosticMessageText(d.messageText, "\n")}`));

		if (context.didFindTypescriptDiagnostics != null) context.didFindTypescriptDiagnostics(diagnostics, { program });
	}

	// Analyze each file
	for (const file of files) {
		// Analyze
		if (context.analyzeSourceFile != null) context.analyzeSourceFile(file, { program });
	}

	return { program, diagnostics, files };
}

/**
 * Expands the globs.
 * @param globs
 */
async function expandGlobs(globs: string | string[]): Promise<string[]> {
	globs = Array.isArray(globs) ? globs : [globs];

	return flatten(
		await Promise.all(
			globs.map(g => {
				try {
					// Test if the glob points to a directory.
					// If so, return the result of a new glob that searches for files in the directory excluding node_modules..
					const dirExists = existsSync(g) && lstatSync(g).isDirectory();
					if (dirExists) {
						return async<string>([...IGNORE_GLOBS, join(g, DEFAULT_DIR_GLOB)], {
							absolute: true,
							followSymlinkedDirectories: false
						});
					}
				} catch (e) {}

				// Return the result of globbing
				return async<string>([...IGNORE_GLOBS, g], {
					absolute: true,
					followSymlinkedDirectories: false
				});
			})
		)
	);
}