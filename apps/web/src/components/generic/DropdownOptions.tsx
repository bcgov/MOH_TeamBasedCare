import { Label } from '../Label';

interface DropdownOptionProps {
  id: string;
  value: string;
}

const defaultSelectValues = {
  defaultValue: 'default',
  id: 'defaultId',
  styling: '',
};

export const DropdownOptions = ({ label, options, select = defaultSelectValues }) => {
  return (
    <div>
      <Label htmlFor={label.htmlFor}>
        {label.text}
        <select defaultValue={select.defaultValue} id={select.id} className={select.styling}>
          {options
            ? options.map((option: DropdownOptionProps) => {
                return (
                  <option key={option.id} value={option.value}>
                    {option.value}
                  </option>
                );
              })
            : null}
        </select>
      </Label>
    </div>
  );
};
