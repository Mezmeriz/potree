export default [
	{
		input: 'src/RollupExport.js',
		treeshake: false,
		output: {
			file: 'build/potree.js',
			format: 'es',
			name: 'Potree',
			sourcemap: true,
		}
	},{
		input: 'src/workers/BinaryDecoderWorker.js',
		output: {
			file: 'build/resources/workers/BinaryDecoderWorker.js',
			format: 'es',
			name: 'Potree',
			sourcemap: false
		}
	},{
		input: 'src/modules/loader/2.0/DecoderWorker.js',
		output: {
			file: 'build/resources/workers/2.0/DecoderWorker.js',
			format: 'es',
			name: 'Potree',
			sourcemap: false
		}
	},{
		input: 'src/modules/loader/2.0/DecoderWorker_brotli.js',
		output: {
			file: 'build/resources/workers/2.0/DecoderWorker_brotli.js',
			format: 'es',
			name: 'Potree',
			sourcemap: false
		}
	}
]
