
function log(message : string ) {
	console.log(`[deno-env][DEBUG] ${message}`)
}

const NEWLINE = '\n'
const RE_INI_KEY_VAL = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/
const RE_NEWLINES = /\\n/g
const NEWLINES_MATCH = /\n|\r|\r\n/


function parse(src: string, options : any) {
	const debug = Boolean(options && options.debug)
	const obj : any = {}

	// convert Buffers before splitting into lines and processing
	src.toString().split(NEWLINES_MATCH).forEach(function (line, idx) {
		// matching "KEY' and 'VAL' in 'KEY=VAL'
		const keyValueArr = line.match(RE_INI_KEY_VAL)
		// matched?
		if (keyValueArr != null) {
			const key = keyValueArr[1]
			// default undefined or missing values to empty string
			let val = (keyValueArr[2] || '')
			const end = val.length - 1
			const isDoubleQuoted = val[0] === '"' && val[end] === '"'
			const isSingleQuoted = val[0] === "'" && val[end] === "'"

			// if single or double quoted, remove quotes
			if (isSingleQuoted || isDoubleQuoted) {
				val = val.substring(1, end)

				// if double quoted, expand newlines
				if (isDoubleQuoted) {
					val = val.replace(RE_NEWLINES, NEWLINE)
				}
			} else {
				// remove surrounding whitespace
				val = val.trim()
			}

			obj[key] = val
		} else if (debug) {
			log(`did not match key and value when parsing line ${idx + 1}: ${line}`)
		}
	})

	return obj
}

// Populates process.env from .env file
export function config(options : any)  {
	let dotenvPath =  '.env'
	let encoding /*: string */ = 'utf8'
	let debug = false

	if (options) {
		if (options.path != null) {
			dotenvPath = options.path
		}
		if (options.encoding != null) {
			encoding = options.encoding
		}
		if (options.debug != null) {
			debug = true
		}
	}

	try {

		const file = Deno.readFileSync(dotenvPath);
		const decoder = new TextDecoder(encoding);
		const parsed = parse(decoder.decode(file),config)

		Object.keys(parsed).forEach(function (key: any) {
			if (!Deno.env.get(key)) {

			Deno.env.set(key,parsed[key])
			} else if (debug) {
				log(`"${key}" is already defined in \`Deno.env\` and will not be overwritten`)
			}
		})

		return { parsed }
	} catch (e) {
		return { error: e }
	}
}


