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
			file: 'build/workers/BinaryDecoderWorker.js',
			format: 'es',
			name: 'Potree',
			sourcemap: false
		}
	}/*,{
		input: 'src/workers/LASDecoderWorker.js',
		output: {
			file: 'build/workers/LASDecoderWorker.js',
			format: 'es',
			name: 'Potree',
			sourcemap: true
		}
	},{
		input: 'src/workers/LASLAZWorker.js',
		output: {
			file: 'build/workers/LASLAZWorker.js',
			format: 'es',
			name: 'Potree',
			sourcemap: true
		}
	}*/
]
