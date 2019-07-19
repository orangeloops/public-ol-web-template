module.exports = {
  extends: ["stylelint-config-recommended-scss"], // "stylelint-a11y/recommended"
  plugins: ["stylelint-prettier"], // "stylelint-a11y"
  rules: {
    "prettier/prettier": null,

    "declaration-block-no-duplicate-properties": null,
    "font-family-no-missing-generic-family-keyword": null,
    "indentation": null,
    "max-empty-lines": 1,
    "no-descending-specificity": null,
    "no-duplicate-selectors": null,
  },
};