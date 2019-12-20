import { SourceFile } from "typescript";
import { ComponentDefinition } from "web-component-analyzer";
import { AnalyzerResult } from "web-component-analyzer/lib/cjs/chunk-7b58dea0";
import { AnalyzerDefinitionStore } from "../analyzer-definition-store";

export class DefaultAnalyzerDefinitionStore implements AnalyzerDefinitionStore {
	private analysisResultForFile = new Map<string, AnalyzerResult>();
	private definitionForTagName = new Map<string, ComponentDefinition>();

	absorbAnalysisResult(sourceFile: SourceFile, result: AnalyzerResult) {
		this.analysisResultForFile.set(sourceFile.fileName, result);

		result.componentDefinitions.forEach(definition => {
			this.definitionForTagName.set(definition.tagName, definition);
		});
	}

	forgetAnalysisResultForFile(sourceFile: SourceFile) {
		const result = this.analysisResultForFile.get(sourceFile.fileName);
		if (result == null) return;

		result.componentDefinitions.forEach(definition => {
			this.definitionForTagName.delete(definition.tagName);
		});

		this.analysisResultForFile.delete(sourceFile.fileName);
	}

	getAnalysisResultForFile(sourceFile: SourceFile): AnalyzerResult | undefined {
		return this.analysisResultForFile.get(sourceFile.fileName);
	}

	getDefinitionsWithDeclarationInFile(sourceFile: SourceFile): ComponentDefinition[] {
		// TODO
		return Array.from(this.definitionForTagName.values()).filter(d =>
			[...d.declaration().declarationNodes].map(n => n.getSourceFile()).find(sf => sf.fileName === sourceFile.fileName)
		);
	}

	getDefinitionForTagName(tagName: string): ComponentDefinition | undefined {
		return this.definitionForTagName.get(tagName);
	}

	getDefinitionsInFile(sourceFile: SourceFile): ComponentDefinition[] {
		const result = this.analysisResultForFile.get(sourceFile.fileName);
		return (result != null && result.componentDefinitions) || [];
	}
}
