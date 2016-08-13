
const resolvePlugin = function (pluginName) {
    return require.resolve(`babel-plugin-${pluginName}`);
};

module.exports = function createOpts(env, react) {
    const flowOrReactPreset = react ? 'react' : 'flow';
    const production = !env.endsWith('-dev');

    if (!production) {
        env = env.slice(0, -4);
    }

    if (env === 'doc') {
        return {
            presets: [
                'jsdoc',
                'jsdoc/object-rest',
                flowOrReactPreset,
                'stage-1'
            ],
            plugins: ['add-jsdoc-annotations']
        };
    }

    let presets;
    let browser;

    switch (env) {
        case 'es5':
            throw new Error('use olderNode instead.');

        case 'test':
        case 'node6':
            presets = ['es2015-node6/object-rest', flowOrReactPreset, 'stage-1'];
            browser = false;
            break;

        case 'older-node':
            presets = ['es2015', flowOrReactPreset, 'stage-1'];
            browser = false;
            break;

        case 'webpack':
            presets = [['es2015', { modules: false }], flowOrReactPreset, 'stage-1'];
            browser = true;
            break;

        case 'webpack-modern-browsers':
            presets = [
                'modern-browsers/webpack2',
                'modern-browsers/object-rest',
                flowOrReactPreset,
                'modern-browsers-stage-1'
            ];
            browser = true;
            break;

        case 'browsers':
            presets = ['es2015', flowOrReactPreset, 'stage-1'];
            browser = true;
            break;

        default:
            throw new Error(`Unsupported env ${env}`);

    }

    return {
        presets: presets,
        plugins: [
            react && resolvePlugin('react-require'),
            // browser && 'react-hot-loader/babel',
            !production && react && 'transform-react-jsx-self',
            !production && resolvePlugin('typecheck'),
            [resolvePlugin('import-rename'), { '^([a-z\\-]+)/src(.*)$': '$1$2' }],
            [resolvePlugin('defines'), {
                'PRODUCTION': production,
                'BROWSER': browser,
                'SERVER': !browser,
                'NODEJS': !browser,
            }],
            [resolvePlugin('discard-module-references'), { 'targets': [], 'unusedWhitelist': ['react']  }],
            resolvePlugin('remove-dead-code'),
        ].filter(Boolean)
    };
};
