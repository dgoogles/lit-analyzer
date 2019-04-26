import { DefaultLitAnalyzerContext } from "../lit-analyzer/default-lit-analyzer-context";
import { LitAnalyzerConfig } from "../lit-analyzer/lit-analyzer-config";
import { logger, LoggingLevel } from "../lit-analyzer/util/logger";

export class LitPluginContext extends DefaultLitAnalyzerContext {
	logger = logger;

	public updateConfig(config: LitAnalyzerConfig) {
		const hasChangedLogging = this.config.verbose !== config.verbose || this.config.cwd !== config.cwd;

		// Setup logging
		this.logger.cwd = config.cwd;
		this.logger.level = config.verbose ? LoggingLevel.VERBOSE : LoggingLevel.NONE;

		if (hasChangedLogging) {
			this.logger.resetLogs();
		}

		super.updateConfig(config);

		logger.debug("Updating the config", config);
	}
}