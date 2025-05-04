import type { RGB as RGBType } from '@telegram-apps/sdk-react';
import type { FC } from 'react';

import { bem } from '@/styles/bem.ts';
import { classNames } from '@/styles/classnames.ts';

import './RGB.css';

const [b, e] = bem('rgb');

export type RGBProps = JSX.IntrinsicElements['div'] & {
  color: RGBType;
};

export const RGB: FC<RGBProps> = ({ color, className, ...rest }) => (
  <span {...rest} className={classNames(b(), className)}>
    <i className={e('icon')} style={{ backgroundColor: color }}/>
    {color}
  </span>
);
