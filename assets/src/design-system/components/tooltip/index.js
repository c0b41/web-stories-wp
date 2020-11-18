/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { useState, useRef, useMemo, useCallback } from 'react';

/**
 * Internal dependencies
 */
// import { prettifyShortcut } from '../keyboard';
import Popup, { Placement } from '../popup';
import { THEME_CONSTANTS } from '../../theme';
import { Text } from '../typography';

const Wrapper = styled.div`
  position: relative;
`;

const Tooltip = styled.div`
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  flex-direction: row;
  max-width: 13em;
  transition: 0.4s opacity;
  opacity: ${({ shown }) => (shown ? 1 : 0)};
  pointer-events: ${({ shown }) => (shown ? 'all' : 'none')};
  z-index: 9999;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.colors.inverted.bg.primary};
`;

const TooltipText = styled(Text)`
  color: ${({ theme }) => theme.colors.inverted.fg.primary};
  padding: 10px;
`;

const SVG_TOOLTIP_TAIL_ID = 'tooltip-tail';
const TAIL_WIDTH = 34;
const TAIL_HEIGHT = 8;
const SPACE_BETWEEN_TOOLTIP_AND_ELEMENT = 8;

const SvgForTail = styled.svg`
  position: absolute;
  width: 0;
  height: 0;
`;
const getTailPosition = ({ placement, translateX, spacing }) => {
  switch (placement) {
    case Placement.TOP:
    case Placement.TOP_START:
    case Placement.TOP_END:
      return css`
        bottom: -${TAIL_HEIGHT - 1}px;
        transform: translateX(${translateX}px) rotate(180deg);
      `;
    case Placement.BOTTOM:
    case Placement.BOTTOM_START:
    case Placement.BOTTOM_END:
      return css`
        top: -${TAIL_HEIGHT - 1}px;
        transform: translateX(${translateX}px);
      `;
    case Placement.LEFT:
    case Placement.LEFT_START:
    case Placement.LEFT_END:
      return css`
        right: -${TAIL_WIDTH - spacing.x - 1}px;
        transform: rotate(90deg);
      `;
    case Placement.RIGHT:
    case Placement.RIGHT_START:
    case Placement.RIGHT_END:
      return css`
        left: -${TAIL_WIDTH - spacing.x - 1}px;
        transform: rotate(-90deg);
      `;
    default:
      return ``;
  }
};

const TooltipArrow = styled.span`
  @supports (clip-path: url('#${SVG_TOOLTIP_TAIL_ID}')) {
    position: absolute;
    display: block;
    height: ${TAIL_HEIGHT}px;
    width: ${TAIL_WIDTH}px;
    ${({ placement, translateX, spacing }) =>
      getTailPosition({ placement, translateX, spacing })};
    background-color: inherit;
    border: none;
    border-bottom: none;
    clip-path: url('#${SVG_TOOLTIP_TAIL_ID}');
  }
`;
const getBoundingBoxCenter = ({ x, width }) => x + width / 2;

function WithTooltip({
  title,
  shortcut,
  hasTail,
  placement = 'bottom',
  children,
  onPointerEnter = () => {},
  onPointerLeave = () => {},
  onFocus = () => {},
  onBlur = () => {},
  ...props
}) {
  const [shown, setShown] = useState(false);
  const [arrowDelta, setArrowDelta] = useState(null);
  const anchorRef = useRef(null);
  const tooltipRef = useRef(null);

  const spacing = useMemo(
    () => ({
      x:
        placement.startsWith('left') || placement.startsWith('right')
          ? SPACE_BETWEEN_TOOLTIP_AND_ELEMENT
          : 0,
      y:
        placement.startsWith('top') || placement.startsWith('bottom')
          ? SPACE_BETWEEN_TOOLTIP_AND_ELEMENT
          : 0,
    }),
    [placement]
  );

  const positionArrow = useCallback(() => {
    const anchorElBoundingBox = anchorRef.current?.getBoundingClientRect();
    const tooltipElBoundingBox = tooltipRef.current?.getBoundingClientRect();
    if (!tooltipElBoundingBox || !anchorElBoundingBox) {
      return;
    }
    const delta =
      getBoundingBoxCenter(anchorElBoundingBox) -
      getBoundingBoxCenter(tooltipElBoundingBox);

    setArrowDelta(delta);
  }, []);

  return (
    <>
      <Wrapper
        onPointerEnter={(e) => {
          setShown(true);
          onPointerEnter(e);
        }}
        onPointerLeave={(e) => {
          setShown(false);
          onPointerLeave(e);
        }}
        onFocus={(e) => {
          setShown(true);
          onFocus(e);
        }}
        onBlur={(e) => {
          setShown(false);
          onBlur(e);
        }}
        ref={anchorRef}
        {...props}
      >
        {children}
      </Wrapper>
      <SvgForTail>
        <clipPath id={SVG_TOOLTIP_TAIL_ID} clipPathUnits="objectBoundingBox">
          <path d="M1,1 L0.868,1 C0.792,1,0.72,0.853,0.676,0.606 L0.585,0.098 C0.562,-0.033,0.513,-0.033,0.489,0.098 L0.399,0.606 C0.355,0.853,0.283,1,0.207,1 L0,1 L1,1" />
        </clipPath>
      </SvgForTail>
      <Popup
        anchor={anchorRef}
        placement={placement}
        spacing={spacing}
        isOpen={Boolean(shown && (shortcut || title))}
        onPositionUpdate={positionArrow}
      >
        <Tooltip ref={tooltipRef} placement={placement} shown={shown}>
          <TooltipText
            as="span"
            size={THEME_CONSTANTS.TYPOGRAPHY_PRESET_SIZES.X_SMALL}
          >
            {title}
          </TooltipText>
          {/* {shortcut ? `${title} (${prettifyShortcut(shortcut)})` : title} */}
          {hasTail && (
            <TooltipArrow
              placement={placement}
              translateX={arrowDelta}
              spacing={spacing}
            />
          )}
        </Tooltip>
      </Popup>
    </>
  );
}

WithTooltip.propTypes = {
  title: PropTypes.string,
  shortcut: PropTypes.string,
  hasTail: PropTypes.bool,
  placement: PropTypes.string,
  onPointerEnter: PropTypes.func,
  onPointerLeave: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  children: PropTypes.node,
};

export default WithTooltip;
