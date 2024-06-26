/**
 * Generates theme.json documentation using theme.json schema.
 * Reads from  : schemas/json/theme.json
 * Publishes to: docs/reference-guides/theme-json-reference/theme-json-living.md
 */

/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs' );
/**
 * Path to root project directory.
 *
 * @type {string}
 */
const ROOT_DIR = path.resolve( __dirname, '../..' );

/**
 * Path to theme json schema file.
 *
 * @type {string}
 */
const THEME_JSON_SCHEMA_FILE = path.resolve(
	ROOT_DIR,
	path.join( 'schemas', 'json', 'theme.json' )
);

/**
 * Path to docs file.
 *
 * @type {string}
 */
const THEME_JSON_REF_DOC = path.resolve(
	ROOT_DIR,
	'docs/reference-guides/theme-json-reference/theme-json-living.md'
);

/**
 * Start token for matching string in doc file.
 *
 * @type {string}
 */
const START_TOKEN = '<!-- START TOKEN Autogenerated - DO NOT EDIT -->';

/**
 * Start token for matching string in doc file.
 *
 * @type {string}
 */
const END_TOKEN = '<!-- END TOKEN Autogenerated - DO NOT EDIT -->';

/**
 * Regular expression using tokens for matching in doc file.
 * Note: `.` does not match new lines, so [^] is used.
 *
 * @type {RegExp}
 */
const TOKEN_PATTERN = new RegExp( START_TOKEN + '[^]*' + END_TOKEN );

const themejson = require( THEME_JSON_SCHEMA_FILE );

/**
 * Convert object keys to an array.
 * Gracefully handles non-object values.
 *
 * @param {*} maybeObject
 * @return {Array} Object keys
 */
const keys = ( maybeObject ) => {
	if ( typeof maybeObject !== 'object' ) {
		return [];
	}
	return Object.keys( maybeObject );
};

/**
 * Get definition from ref.
 *
 * @param {string} ref
 * @return {Object} definition
 * @throws {Error} If the referenced definition is not found in 'themejson.definitions'.
 *
 * @example
 * getDefinition( '#/definitions/typographyProperties/properties/fontFamily' )
 *  // returns themejson.definitions.typographyProperties.properties.fontFamily
 */
const resolveDefinitionRef = ( ref ) => {
	const refParts = ref.split( '/' );
	const definition = refParts[ refParts.length - 1 ];
	if ( ! themejson.definitions[ definition ] ) {
		throw new Error( `Can't resolve '${ ref }'. Definition not found` );
	}
	return themejson.definitions[ definition ];
};

/**
 * Get properties from an array.
 *
 * @param {Object} items
 * @return {Object} properties
 */
const getPropertiesFromArray = ( items ) => {
	// if its a $ref resolve it
	if ( items.$ref ) {
		return resolveDefinitionRef( items.$ref ).properties;
	}

	// otherwise just return the properties
	return items.properties;
};

/**
 * Convert settings properties to markup.
 *
 * @param {Object} struct
 * @return {string} markup
 */
const getSettingsPropertiesMarkup = ( struct ) => {
	if ( ! ( 'properties' in struct ) ) {
		return '';
	}
	const props = struct.properties;
	const ks = keys( props );
	if ( ks.length < 1 ) {
		return '';
	}

	let markup = '| Property  | Type   | Default | Props  |\n';
	markup += '| ---    | ---    | ---    |---   |\n';
	ks.forEach( ( key ) => {
		const def = 'default' in props[ key ] ? props[ key ].default : '';
		let type = props[ key ].type || '';
		let ps =
			props[ key ].type === 'array'
				? keys( getPropertiesFromArray( props[ key ].items ) )
						.sort()
						.join( ', ' )
				: '';

		/*
		 * Handle`oneOf` type definitions - extract the type and properties.
		 * See: https://json-schema.org/understanding-json-schema/reference/combining#oneOf
		 */
		if ( props[ key ].oneOf && Array.isArray( props[ key ].oneOf ) ) {
			if ( ! type ) {
				type = props[ key ].oneOf
					.map( ( item ) => item.type )
					.join( ', ' );
			}

			if ( ! ps ) {
				ps = props[ key ].oneOf
					.map( ( item ) =>
						item?.type === 'object' && item?.properties
							? '_{' +
							  keys( getPropertiesFromArray( item ) )
									.sort()
									.join( ', ' ) +
							  '}_'
							: ''
					)
					.join( ' ' );
			}
		}

		markup += `| ${ key } | ${ type } | ${ def } | ${ ps } |\n`;
	} );

	return markup;
};

/**
 * Convert style properties to markup.
 *
 * @param {Object} struct
 * @return {string} markup
 */
const getStylePropertiesMarkup = ( struct ) => {
	if ( ! ( 'properties' in struct ) ) {
		return '';
	}
	const props = struct.properties;
	const ks = keys( props );
	if ( ks.length < 1 ) {
		return '';
	}

	let markup = '| Property  | Type   |  Props  |\n';
	markup += '| ---       | ---    |---   |\n';
	ks.forEach( ( key ) => {
		const ps =
			props[ key ].type === 'object'
				? keys( props[ key ].properties ).sort().join( ', ' )
				: '';
		const type = formatType( props[ key ] );
		markup += `| ${ key } | ${ type } | ${ ps } |\n`;
	} );

	return markup;
};

/**
 * Parses a section for description and properties and
 * returns a marked up version.
 *
 * @param {string} title
 * @param {Object} data
 * @param {string} type  settings|style
 * @return {string} markup
 */
const getSectionMarkup = ( title, data, type ) => {
	const markupFn =
		type === 'settings'
			? getSettingsPropertiesMarkup
			: getStylePropertiesMarkup;

	return `
### ${ title }

${ data.description }

${ markupFn( data ) }
---
`;
};

let autogen = '';

/**
 * Format list of types.
 *
 * @param {Object} prop
 * @return {string} type
 */
const formatType = ( prop ) => {
	let type = prop.type || '';

	if ( prop.hasOwnProperty( 'anyOf' ) || prop.hasOwnProperty( 'oneOf' ) ) {
		const propTypes = prop.anyOf || prop.oneOf;
		const types = [];

		propTypes.forEach( ( item ) => {
			if ( item.type ) types.push( item.type );
			// refComplete is always an object
			if ( item.$ref && item.$ref === '#/definitions/refComplete' )
				types.push( 'object' );
		} );

		type = [ ...new Set( types ) ].join( ', ' );
	}

	return type;
};

// Settings
const settings = Object.entries( themejson.definitions )
	.filter( ( [ settingsKey ] ) =>
		/^settingsProperties(?!Complete)\w+$/.test( settingsKey )
	)
	.reduce(
		( settingsObj, [ , { properties } ] ) =>
			Object.assign( settingsObj, properties ),
		{}
	);
const settingSections = keys( settings );
autogen += '## Settings' + '\n\n';
settingSections.forEach( ( section ) => {
	autogen += getSectionMarkup( section, settings[ section ], 'settings' );
} );

// Styles
const styles = themejson.definitions.stylesProperties.properties;
const styleSections = keys( styles );
autogen += '## Styles' + '\n\n';
styleSections.forEach( ( section ) => {
	autogen += getSectionMarkup( section, styles[ section ], 'styles' );
} );

const templateTableGeneration = ( themeJson, context ) => {
	let content = '';
	content += '## ' + context + '\n\n';
	content += themeJson.properties[ context ].description + '\n\n';
	content +=
		'Type: `' + themeJson.properties[ context ].items.type + '`.\n\n';
	content += '| Property | Description | Type |\n';
	content += '| ---      | ---         | ---  |\n';
	keys( themeJson.properties[ context ].items.properties ).forEach(
		( key ) => {
			content += `| ${ key } | ${ themeJson.properties[ context ].items.properties[ key ].description } | ${ themeJson.properties[ context ].items.properties[ key ].type } |\n`;
		}
	);
	content += '\n\n';

	return content;
};

// customTemplates
autogen += templateTableGeneration( themejson, 'customTemplates' );

// templateParts
autogen += templateTableGeneration( themejson, 'templateParts' );

// Patterns
autogen += '## Patterns' + '\n\n';
autogen += themejson.properties.patterns.description + '\n';
autogen += 'Type: `' + themejson.properties.patterns.type + '`.\n\n';

// Read existing file to wrap auto generated content.
let docsContent = fs.readFileSync( THEME_JSON_REF_DOC, {
	encoding: 'utf8',
	flag: 'r',
} );

// Replace auto generated part with new generated docs.
autogen = START_TOKEN + '\n' + autogen + '\n' + END_TOKEN;
docsContent = docsContent.replace( TOKEN_PATTERN, autogen );

// Write back out.
fs.writeFileSync( THEME_JSON_REF_DOC, docsContent, { encoding: 'utf8' } );
