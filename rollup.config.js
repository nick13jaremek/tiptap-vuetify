import commonjs from 'rollup-plugin-commonjs'
import vue from 'rollup-plugin-vue'
import typescript from 'rollup-plugin-typescript2'
import alias from 'rollup-plugin-alias'
import postcss from 'rollup-plugin-postcss'
import resolve from 'rollup-plugin-node-resolve'
import ttypescript from 'ttypescript'
import { join } from 'path'
import postcssPresetEnv from 'postcss-preset-env'

const isProduction = process.env.BUILD === 'production'
const srtDir = join(__dirname, 'src')
const distDir = join(__dirname, 'dist')

export default async () => [
  // You can also get a more optimized wrapper by creating dedicated builds for the formats “cjs” (Node), “amd” or “iife” (script tag)
  await getConfig({
    optimize: true,
    output: {
      file: join(distDir, 'bundle-umd.js'),
      format: 'umd',
      esModule: true
    }
    // не важно какой output.format, главное сгенерировать css файл один раз, а не для каждой сборки (конфига)
    // generateCssFile: join(distDir, 'main.css')
  }),
  await getConfig({
    output: {
      file: join(distDir, 'bundle-esm.js'),
      format: 'esm',
      // это отдельная сборка под ES модули
      esModule: true
    }
  }),
  await getConfig({
    optimize: true,
    output: {
      file: join(distDir, 'bundle-cjs.js'),
      format: 'cjs'
    }
  }),
  await getConfig({
    optimize: true,
    output: {
      file: join(distDir, 'bundle-iife.js'),
      format: 'iife'
    }
  })
]

async function getConfig ({
  optimize = false,
  output: {
    file,
    format,
    esModule = false
  },
  plugins = []
}) {
  return {
    input: join(srtDir, 'main.ts'),
    output: {
      esModule,
      file,
      format,
      exports: 'named',
      // используется в umd и в iife
      name: 'tiptapVuetify',
      globals: {
        vue: 'Vue',
        // https://github.com/vuejs/vue-class-component/blob/master/build/build.js
        // 'vue-class-component': 'VueClassComponent',
        // https://github.com/kaorun343/vue-property-decorator/blob/master/rollup.config.js
        // 'vue-property-decorator': 'VuePropertyDecorator',
        tiptap: 'tiptap',
        // Походу так и есть: https://github.com/scrumpy/tiptap/blob/master/build/packages/config.js#L44
        'tiptap-extensions': 'tiptap', // TODO tiptapExtensions
        vuetify: 'Vuetify'
      }
    },
    // можно Object.keys(globals)
    external: [
      'vue',
      // 'vue-class-component',
      // 'vue-property-decorator',
      'tiptap',
      'tiptap-extensions',
      'vuetify'
    ],
    plugins: [
      alias({
        resolve: ['.ts', '.js', '.vue'],
        '~': srtDir
      }),
      // TODO раньшн resolve был после commonjs (но в github я видел в таком порядке)
      resolve({
        extensions: ['.ts', '.js', '.json'],
        customResolveOptions: {
          moduleDirectory: 'node_modules'
        }
      }),
      commonjs(),
      // TODO autoprefixer
      postcss({
        // TODO для каждого конфига генерируется свой main.css (одинаковый файл), исправить
        extract: join(distDir, 'main.css'),
        minimize: true,
        plugins: [
          postcssPresetEnv
        ]
      }),
      typescript({
        // это фиксит Unknown object type "asyncfunction"
        // https://github.com/ezolenko/rollup-plugin-typescript2/issues/105
        clean: true,
        typescript: ttypescript
      }),
      vue({
        defaultLang: { script: 'ts' },
        // Inject CSS in JavaScript. Setting css: false would extract styles in a .css file.
        css: false
      }),
      // оптимизация
      optimize && isProduction && (await import('rollup-plugin-terser')).terser(),
      ...plugins
    ]
  }
}
