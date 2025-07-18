module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: {
    // Customize as needed
    "max-len": ["error", { code: 100 }],
    indent: ["error", 2],
    "comma-dangle": ["error", "always-multiline"],
    "object-curly-spacing": ["error", "never"],
    "valid-jsdoc": "off",
  },
};
