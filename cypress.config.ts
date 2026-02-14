import { defineConfig } from "cypress";
import { configureVisualRegression } from "cypress-visual-regression/dist/plugin";

export default defineConfig({
  e2e: {
    env: {
      visualRegressionType: "regression",
      visualRegressionBaseDirectory: "cypress/snapshots/base",
      visualRegressionDiffDirectory: "cypress/snapshots/diff",
      visualRegressionGenerateDiff: "always",
      visualRegressionFailSilently: true,
    },
    setupNodeEvents(on) {
      configureVisualRegression(on);
    },
  },
});
