/**
 * WordPress dependencies
 */
import { Button, Dropdown, ToolbarGroup } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { DOWN } from '@wordpress/keycodes';

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
		<Dropdown
			popoverProps={ POPOVER_PROPS }
			renderToggle={ ( { onToggle, isOpen } ) => {
				const openOnArrowDown = ( event ) => {
					if ( ! isOpen && event.keyCode === DOWN ) {
						event.preventDefault();
						event.stopPropagation();
						onToggle();
					}
				};

				return (
					<Button
						onClick={ onToggle }
						aria-haspopup="true"
						aria-expanded={ isOpen }
						label={ __( 'Change heading level' ) }
						onKeyDown={ openOnArrowDown }
						showTooltip
						icon={ <HeadingLevelIcon level={ selectedLevel } /> }
					/>
				);
			} }
			renderContent={ () => (
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
		></Dropdown>
	);
}
