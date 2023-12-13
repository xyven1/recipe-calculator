module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
    "@vue/eslint-config-typescript",
  ],
  rules: {
    "vue/multi-word-component-names": "off",
    "vue/max-attributes-per-line": [
      "warn",
      {
        singleline: {
          max: 6,
        },
        multiline: {
          max: 6,
        },
      },
    ],
  },
};
