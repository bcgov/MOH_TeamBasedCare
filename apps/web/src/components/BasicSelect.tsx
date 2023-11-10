import { CSSProperties } from 'react';
import ReactSelect, { StylesConfig, components, GroupBase } from 'react-select';
import { DropdownIndicatorProps } from 'react-select/dist/declarations/src/components/indicators';
import { Property } from 'csstype';
import { OptionValueType, SelectOption, StyleOption } from 'src/common/select-options.constants';
import { Label } from './Label';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';

export interface BasicSelectProps<T extends OptionValueType> {
  id: string;
  options: SelectOption<T>[];
  value: T;
  label?: string;
  onChange: (value: T) => void;
  textAlign?: Property.TextAlign;
  underline?: boolean;
  optionStyle?: CSSProperties;
}

const DropdownIndicator = <T extends OptionValueType>(
  props: DropdownIndicatorProps<SelectOption<T>, false, GroupBase<SelectOption<T>>>,
) => {
  return (
    <components.DropdownIndicator {...props}>
      <FontAwesomeIcon className='w-5 h-5' icon={faCaretDown} />
    </components.DropdownIndicator>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Input = (props: any) => {
  return <components.Input {...props} />;
};

export const BasicSelect = <T extends OptionValueType>(props: BasicSelectProps<T>) => {
  const {
    id,
    value,
    label,
    options,
    onChange,
    textAlign = 'center',
    underline = false,
    optionStyle,
  } = props;

  return (
    <div>
      {label && (
        <div className='mb-2'>
          <Label htmlFor={id}>{label}</Label>
        </div>
      )}
      <ReactSelect<SelectOption<T>>
        inputId={id}
        aria-label={label || `${id} label`}
        value={value ? options.find(o => o.value === value) : null}
        onChange={option => option && onChange(option.value)}
        getOptionLabel={o => `${o.label || o.value}`}
        isOptionDisabled={o => o.value === value}
        options={options}
        styles={getNoBorderSelectStyle<SelectOption<T>>(textAlign, underline, optionStyle)}
        components={{ DropdownIndicator, Input }}
        menuPlacement='top'
      />
    </div>
  );
};

const getNoBorderSelectStyle = <T extends StyleOption>(
  textAlign: Property.TextAlign,
  underline: boolean,
  optionStyle?: CSSProperties,
): StylesConfig<T, boolean> => {
  return {
    indicatorSeparator: styles => ({ ...styles, display: 'none' }),
    indicatorsContainer: styles => ({ ...styles, color: 'black' }),
    control: styles => ({
      ...styles,
      display: 'flex',
      padding: '1px',
      border: '0',
      borderRadius: '0',
      borderBottom: underline ? '2px solid #313132' : 'none',
      cursor: 'pointer',
    }),
    option: (styles, { data, isDisabled }) => ({
      ...styles,
      padding: '10px 10px',
      background: isDisabled ? 'rgb(215, 215, 215)' : 'white',
      color: 'black',
      '&:hover': {
        background: '#F2F2F2',
      },
      ...data?.style,
      ...optionStyle,
    }),
    menuList: styles => ({ ...styles, maxHeight: '350px' }),
    menu: styles => ({ ...styles, padding: '5px 5px', textAlign }),
    placeholder: styles => ({ ...styles, color: '#606060' }),
  };
};

export const getSelectStyleOverride = <T extends StyleOption>(
  bgColour?: string,
): StylesConfig<T, boolean> => {
  const getBgColour = bgColour || '#F5F5F5';

  const selectStyleOverride: StylesConfig<T, boolean> = {
    indicatorSeparator: styles => ({ ...styles }),
    clearIndicator: styles => ({ ...styles, color: 'black' }),
    indicatorsContainer: styles => ({ ...styles, color: 'black' }),
    dropdownIndicator: styles => ({
      ...styles,
      color: 'black',
      transform: 'scale(0.8, 0.85)',
    }),
    input: styles => ({ ...styles }),
    control: (styles, { isDisabled }) => ({
      ...styles,
      display: 'flex',
      padding: '1px',
      border: '0',
      borderBottom: isDisabled ? 'none' : '2px solid #313132',
      background: isDisabled ? 'rgb(215, 215, 215)' : getBgColour,
      borderRadius: '0',
    }),
    option: (styles, { data, isDisabled }) => ({
      ...styles,
      padding: '10px 20px',
      background: isDisabled ? 'rgb(215, 215, 215)' : 'white',
      color: 'black',
      '&:hover': {
        background: '#F2F2F2',
      },
      ...data?.style,
    }),
    menuList: styles => ({ ...styles, maxHeight: '350px' }),
    menu: styles => ({ ...styles, padding: '5px 10px' }),
    placeholder: styles => ({ ...styles, color: '#606060' }),
  };
  return selectStyleOverride;
};
