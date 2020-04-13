/**
 * WordPress dependencies
 */
import { Toolbar, ToolbarGroup } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import HeadingLevelIcon from './heading-level-icon';

const HEADING_LEVELS = [ 1, 2, 3, 4, 5, 6 ];

const POPOVER_PROPS = {
	className: 'block-editor-heading-level-toolbar',
	isAlternate: true,
};

/** @typedef {import('@wordpress/element').WPComponent} WPComponent */

/**
 * HeadingLevelToolbar props.
 *
 * @typedef WPHeadingLevelToolbarProps
 *
 * @property {number}   selectedLevel  The chosen heading level.
 * @property {Function} onChange       Callback to run when toolbar value is changed.
 */

/**
 * Toolbar for selecting a heading level (1 through 6).
 *
 * @param {WPHeadingLevelToolbarProps} props Component props.
 *
 * @return {WPComponent} The toolbar.
 */
export default function HeadingLevelToolbar( { selectedLevel, onChange } ) {
	return (
		<Toolbar
			isCollapsed={ true }
			icon={ <HeadingLevelIcon level={ selectedLevel } /> }
			label={ __( 'Change heading level' ) }
			popoverProps={ POPOVER_PROPS }
		>
			{ () => (
				<ToolbarGroup
					isCollapsed={ false }
					controls={ HEADING_LEVELS.map( ( targetLevel ) => {
						const isActive = targetLevel === selectedLevel;
						return {
							icon: (
								<HeadingLevelIcon
									level={ targetLevel }
									isPressed={ isActive }
								/>
							),
							// translators: %s: heading level e.g: "1", "2", "3"
							title: sprintf( __( 'Heading %d' ), targetLevel ),
							isActive,
							onClick() {
								onChange( targetLevel );
							},
						};
					} ) }
				/>
			) }
		</Toolbar>
	);
}
