// ESLint flat config for Vue 3 + TypeScript
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import { resolve } from 'pathe'

export default tseslint.config(
  {
    ignores: ['eslint.config.*', '.nuxt/**', '.output/**', 'node_modules/**', 'dist/**', 'tailwind.config.*', 'postcss.config.*']
  },
  js.configs.recommended,
  ...vue.configs['flat/recommended'],
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 2022,
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
        tsconfigRootDir: resolve('.'),
        projectService: true
      }
    },
    rules: {
      'no-undef': 'off',
      'no-console': 'off',
      'no-debugger': 'warn',
      'vue/multi-word-component-names': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
)


