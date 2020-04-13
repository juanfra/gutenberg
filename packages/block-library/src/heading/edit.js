/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import {
	AlignmentToolbar,
	BlockControls,
	RichText,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';
import { Platform } from '@wordpress/element';

/**
 * Internal dependencies
 */
import HeadingLevelToolbar from './heading-level-toolbar';

function HeadingEdit( { attributes, setAttributes, mergeBlocks, onReplace } ) {
	const { align, content, level, placeholder, style } = attributes;
	const tagName = 'h' + level;
	const isAndroid = Platform.select( {
		android: true,
		native: false,
		web: false,
	} );

	const styles = {
		color: style && style.color && style.color.text,
	};

	return (
		<>
			<BlockControls>
				<HeadingLevelToolbar
					selectedLevel={ level }
					onChange={ ( newLevel ) =>
						setAttributes( { level: newLevel } )
					}
				/>
				{ ! isAndroid && (
					<AlignmentToolbar
						value={ align }
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
					/>
				) }
			</BlockControls>
			<RichText
				identifier="content"
				tagName={ Block[ tagName ] }
				value={ content }
				onChange={ ( value ) => setAttributes( { content: value } ) }
				onMerge={ mergeBlocks }
				onSplit={ ( value ) => {
					if ( ! value ) {
						return createBlock( 'core/paragraph' );
					}

					return createBlock( 'core/heading', {
						...attributes,
						content: value,
					} );
				} }
				onReplace={ onReplace }
				onRemove={ () => onReplace( [] ) }
				className={ classnames( {
					[ `has-text-align-${ align }` ]: align,
				} ) }
				placeholder={ placeholder || __( 'Write heading…' ) }
				textAlign={ align }
				style={ styles }
			/>
		</>
	);
}

export default HeadingEdit;
